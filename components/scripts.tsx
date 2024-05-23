"use client";

import React, { useState, useEffect } from "react";
import { FaRegFileCode } from "react-icons/fa";
import { VscNewFile } from "react-icons/vsc";
import { GoTrash, GoPaperAirplane, GoPencil} from "react-icons/go";
import {
    Card,
    CardHeader,
    CardBody,
    Button,
} from "@nextui-org/react";

export default function Scripts() {
    const [files, setFiles] = useState<Record<string,string>>({});

    useEffect(() => {
        fetch("http://localhost:3000/api/file")
            .then((response) => response.json())
            .then((files: Record<string, string>) => setFiles(files))
            .catch((error) => console.error(error));
    }, []);

    useEffect(() => {
        console.log(files)
    }, [files]);

    const ScriptItems = files && Object.keys(files) ? (
        <div className="grid grid-cols-2 gap-4">
            <Button
                size="lg"
                startContent={<VscNewFile/>}
                color="primary"
                className="col-span-2"
                onPress={() => {{ window.location.href = '/build?file=new'}}}
            >
                Create a new script
            </Button>
            {Object.keys(files).map((file) => (
                <Card key={file.replace(".gpt", "")} className="p-4">
                    <CardHeader className="flex justify-between ">
                        <div className="flex gap-3 items-center">
                            <FaRegFileCode />
                            {file.replace('.gpt', '')}
                        </div>
                        <div className="flex-col flex absolute bottom-1 right-4">
                            <Button startContent={<GoPaperAirplane />} onPress={() => {{ window.location.href = `/run?file=${file.replace('.gpt', '')}`;}}} radius="full" variant="light" isIconOnly/>
                            <Button startContent={<GoPencil />} onPress={() => {{ window.location.href = `/build?file=${file.replace('.gpt', '')}`;}}} radius="full" variant="light" isIconOnly/>
                            <Button startContent={<GoTrash />} radius="full" variant="light" isIconOnly/>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <p className="truncate w-4/5 text-zinc-500">{files[file] ? files[file] : "No description provided"}</p>
                    </CardBody>
                </Card>
            ))}
        </div>
    ) : (
        <Card>
            <CardBody className="flex gap-3">
                <p>No files found</p>
            </CardBody>
        </Card>
    );

    return (
        <div>
            {ScriptItems}
        </div>
    );
}