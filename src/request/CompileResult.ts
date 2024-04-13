export type Link = {
    text: string;
    url: string;
};

export type Fix = {
    title: string;
    edits: MessageWithLocation[];
};

export type MessageWithLocation = {
    line?: number;
    column?: number;
    file?: string;
    text: string;
    endline?: number;
    endcolumn?: number;
};

export type ResultLineTag = MessageWithLocation & {
    severity: number;
    link?: Link;
    flow?: MessageWithLocation[];
    fixes?: Fix[];
};

export type ResultLineSource = {
    file: string | null;
    line: number;
    mainsource?: boolean;
};

export type ResultLine = {
    text: string;
    tag?: ResultLineTag;
    source?: ResultLineSource;
    line?: number; // todo: this should not exist
};

// TODO:
export type LanguageKey = {};

export type ToolTypeKey = 'independent' | 'postcompilation';

export type ToolInfo = {
    id: string;
    name?: string;
    type?: ToolTypeKey;
    exe: string;
    exclude: string[];
    includeKey?: string;
    options: string[];
    args?: string;
    languageId?: LanguageKey;
    stdinHint?: string;
    monacoStdin?: string;
    icon?: string;
    darkIcon?: string;
    compilerLanguage: LanguageKey;
};

export type Tool = {
    readonly tool: ToolInfo;
    readonly id: string;
    readonly type: string;
};

export enum ArtifactType {
    download = 'application/octet-stream',
    nesrom = 'nesrom',
    bbcdiskimage = 'bbcdiskimage',
    zxtape = 'zxtape',
    smsrom = 'smsrom',
    timetrace = 'timetracejson',
    c64prg = 'c64prg',
    heaptracktxt = 'heaptracktxt',
}

export type Artifact = {
    content: string;
    type: string;
    name: string;
    title: string;
};

export type ToolResult = {
    id: string;
    name?: string;
    code: number;
    languageId?: LanguageKey | 'stderr';
    stderr: ResultLine[];
    stdout: ResultLine[];
    artifact?: Artifact;
    sourcechanged?: boolean;
    newsource?: string;
};

export type BuildEnvDownloadInfo = {
    step: string;
    packageUrl: string;
    time: string;
};

export type BuildResult = CompileResult & {
    downloads: BuildEnvDownloadInfo[];
    executableFilename: string;
    compilationOptions: string[];
    stdout: ResultLine[];
    stderr: ResultLine[];
    code: number;
};

export type CompileResult = {
    code: number;
    timedOut: boolean;
    okToCache?: boolean;
    buildResult?: BuildResult;
    // TODO: buildsteps?: BuildStep[];
    inputFilename?: string;
    asm?: ResultLine[];
    devices?: Record<string, CompileResult>;
    stdout: ResultLine[];
    stderr: ResultLine[];
    truncated?: boolean;
    didExecute?: boolean;
    execResult?: {
        stdout?: ResultLine[];
        stderr?: ResultLine[];
        code: number;
        didExecute: boolean;
        buildResult?: BuildResult;
        execTime?: number;
    };
    hasGnatDebugOutput?: boolean;
    gnatDebugOutput?: ResultLine[];
    hasGnatDebugTreeOutput?: boolean;
    gnatDebugTreeOutput?: ResultLine[];
    tools?: ToolResult[];
    dirPath?: string;
    compilationOptions?: string[];
    downloads?: BuildEnvDownloadInfo[];
    gccDumpOutput?: any;
    languageId?: string;
    result?: CompileResult; // cmake inner result

    hasPpOutput?: boolean;
    ppOutput?: any;

    hasOptOutput?: boolean;
    optOutput?: any;
    optPath?: string;

    hasStackUsageOutput?: boolean;
    //TODO: stackUsageOutput?: suCodeEntry[];
    stackUsagePath?: string;

    hasAstOutput?: boolean;
    astOutput?: any;

    hasIrOutput?: boolean;

    // TODO:
    //irOutput?: {
    //    asm: ParsedAsmResultLine[];
    //    cfg?: CFGResult;
    //};

    hasOptPipelineOutput?: boolean;
    // TODO:
    // optPipelineOutput?: OptPipelineOutput;

    // cfg?: CFGResult;

    hasRustMirOutput?: boolean;
    rustMirOutput?: any;

    hasRustMacroExpOutput?: boolean;
    rustMacroExpOutput?: any;

    hasRustHirOutput?: boolean;
    rustHirOutput?: any;

    hasHaskellCoreOutput?: boolean;
    haskellCoreOutput?: any;

    hasHaskellStgOutput?: boolean;
    haskellStgOutput?: any;

    hasHaskellCmmOutput?: boolean;
    haskellCmmOutput?: any;

    forceBinaryView?: boolean;

    artifacts?: Artifact[];

    hints?: string[];

    retreivedFromCache?: boolean;
    retreivedFromCacheTime?: number;
    packageDownloadAndUnzipTime?: number;
    execTime?: number | string;
    processExecutionResultTime?: number;
    objdumpTime?: number;
    parsingTime?: number;

    source?: string; // todo: this is a crazy hack, we should get rid of it
};

export type ExecuteResult = {
    code: number;
    okToCache: boolean;
    stdout: ResultLine[];
    stderr: ResultLine[];
    execTime: string;
    processExecutionResultTime?: number;
    timedOut: boolean;
    languageId?: string;
    truncated?: boolean;
};