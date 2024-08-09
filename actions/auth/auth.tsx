"use server"

import {cookies} from "next/headers"
import {create, get, list } from "@/actions/common"
import { gpt } from "@/config/env"
import { Block, RunEventType, ToolDef } from "@gptscript-ai/gptscript"


const tokenRequestToolInstructions = `
Credential: github.com/gptscript-ai/gateway-creds as gateway-creds
Name: getCreds

#!/usr/bin/env python3

import os
import json

output = {
    "token": os.getenv("GPTSCRIPT_GATEWAY_API_KEY", ""),
    "expiresAt": os.getenv("GPTSCRIPT_CREDENTIAL_EXPIRATION", ""),
}

print(json.dumps(output), end="")

---

!metadata:getCreds:requirements.txt

`;

export interface AuthProvider {
    id?: string
    type: string
    serviceName?: string
    slug?: string
    clientID?: string
    clientSecret?: string
    oauthURL?: string
    tokenURL?: string
    scopes?: string
    redirectURL?: string
    disabled?: boolean
}

export async function setCookies(token: string, expiresAt: string): Promise<void> {
    cookies().set("gateway_token", token, {domain: "localhost"})
    cookies().set("expires_at", expiresAt, {domain: "localhost"})
}

export async function logout(): Promise<void> {
    cookies().delete("gateway_token")
}

export async function getAuthProviders(): Promise<AuthProvider[]> {
    return await list("auth-providers")
}

export async function createTokenRequest(id: string, oauthServiceName: string): Promise<string> {
    return (await create({id: id, serviceName: oauthServiceName} as any, "token-request"))["token-path"]
}

/*
    This function is used to login through a GPTScript tool. This is useful because GPTScript will handle the
    storing of this token on our behalf as well as the OAuth flow.

    This loginTimeout is used to track the current logim timeout. If the token is about to expire, we will
    automatically log in again. We have an in-memory timeout to prevent multiple expiration checks from
    happening at the same time.
    */
let loginTimeout: NodeJS.Timeout | null = null;
export async function loginThroughTool(): Promise<void> {
    if (loginTimeout) {
        clearTimeout(loginTimeout);
        loginTimeout = null;
    }

    const run = await gpt().evaluate({instructions: tokenRequestToolInstructions} as ToolDef, {prompt: true})
    run.on(RunEventType.Prompt, (data) => {
        gpt().promptResponse({id: data.id, responses: {}})
    })

    const response = JSON.parse(await run.text()) as {token: string, expiresAt: string}
    setCookies(response.token, response.expiresAt);

    loginTimeout = setTimeout(() => {
        loginTimeout = null;
        loginThroughTool();
    }, new Date(response.expiresAt).getTime() - Date.now() - 1000 * 60 * 5)
}

export async function pollForToken(id: string): Promise<string> {
    while (true) {
        const token = (await get<any>("token-request", id)).token || ""
        if (token != "") {
            return token
        }

        await new Promise(r => setTimeout(r, 1000))
    }
}