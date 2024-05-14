import React, { useState, useEffect, useContext } from "react";
import { subtitle } from "@/components/primitives";
import { io, Socket } from "socket.io-client";
import type { Property, Frame } from "@gptscript-ai/gptscript";
import { FaBackward } from "react-icons/fa";
import { BuildContext } from "@/app/build/page";
import { IoCloseSharp } from "react-icons/io5";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Divider,
} from "@nextui-org/react";

interface RunProps {
    name: string;
    file: string;
    args: Record<string, Property> | undefined;
}

export default function Chat({ name, file, args }: RunProps) {
    const [messages, setMessages] = useState<String[]>([]);
    const [connected, setConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [showForm, setShowForm] = useState(true);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const {setChatPanel, setLogs } = useContext(BuildContext);

    useEffect(() => {
        const socket = io();
        socket.on('connect', () => {
            setLogs([])
            setConnected(true)
        })
        socket.on('event', (data: Frame) => setLogs((prevLogs) => [...prevLogs, data]))
        socket.on('scriptMessage', data => setMessages((prevMessages) => [...prevMessages, data]));
        socket.on('disconnect', () => { setConnected(false) });
        setSocket(socket);
        return () => { 
            setSocket(null);
            socket.disconnect()
        };
    }, []);

    const handleFormSubmit = () => {
        setShowForm(false);
        console.log(formValues);
        socket?.emit('run', file, name, formValues);
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues((prevValues) => ({
            ...prevValues,
            [event.target.name]: event.target.value
        }));
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-col gap-1 px-4 py-2">
                <div className="w-full flex justify-between">
                    <h1 className={subtitle()}>
                        You're about to run <span className="capitalize font-bold text-primary">{name}</span>
                    </h1>
                    <Button
                        radius="full"
                        isIconOnly
                        color="primary"
                        onPress={(_) => setChatPanel(<></>)}
                    >
                        <IoCloseSharp />
                    </Button>
                </div>
            </CardHeader>
            <Divider />
            <CardBody className="overflow-y-scroll shadow px-6 pb-6">
                {showForm ? (
                    <form>
                        {Object.entries(args || {}).map(([argName, arg]) => (
                            <div key={argName} className="mb-4">
                                <label htmlFor={argName} className="block font-medium mb-1">{argName}</label>
                                <input
                                    type="text"
                                    id={argName}
                                    name={argName}
                                    value={formValues[argName] || ''}
                                    onChange={handleInputChange}
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                />
                            </div>
                        ))}
                    </form>
                ) : (
                    <div>
                        {messages.map((message, index) => (
                            <div key={index} className="flex flex-col items-end mb-2">
                                <div className="rounded-2xl bg-blue-500 text-white py-2 px-4 max-w-[75%]">
                                    {message}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
            <CardFooter>
                {showForm ? (
                    <Button 
                        className="w-full"
                        type="submit"
                        color="secondary"
                        onPress={handleFormSubmit} 
                    >
                        Run Script
                    </Button>
                ) : 
                    <Button 
                        className="w-full"
                        onPress={() => setShowForm(true)}
                        startContent={<FaBackward />}
                    >
                        Back
                    </Button>
                }
            </CardFooter>
        </Card>
    );
}
