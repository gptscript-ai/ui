import {GPTScript} from "@gptscript-ai/gptscript"
import path from "path";

export const SCRIPTS_PATH = () => process.env.SCRIPTS_PATH || "gptscripts";
export const WORKSPACE_DIR = () => process.env.WORKSPACE_DIR || "";
export const THREADS_DIR = () => process.env.THREADS_DIR || path.join(WORKSPACE_DIR(), "threads");
export const GATEWAY_URL = () => process.env.GATEWAY_URL || "http://localhost:8080";

export const set_WORKSPACE_DIR = (dir: string) => process.env.GPTSCRIPT_WORKSPACE_DIR = dir;

let gptscript: GPTScript | null = null;

export function gpt() {
    if (!gptscript) {
        gptscript = new GPTScript({
            DefaultModelProvider: 'github.com/gptscript-ai/gateway-provider'
        });
    }
    return gptscript;
}