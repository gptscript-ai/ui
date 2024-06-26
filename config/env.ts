export const SCRIPTS_PATH = () => process.env.SCRIPTS_PATH || "gptscripts";
export const WORKSPACE_DIR = () => process.env.GPTSCRIPT_WORKSPACE_DIR || "";

export const set_WORKSPACE_DIR = (dir: string) => process.env.GPTSCRIPT_WORKSPACE_DIR = dir;
export const set_SCRIPTS_PATH = (dir: string) => process.env.SCRIPTS_PATH = dir;