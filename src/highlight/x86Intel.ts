const registers = [
    "rax",
    "rbx",
    "rcx",
    "rdx",
    "rsi",
    "rdi",
    "rbp",
    "rsp",
    "r8",
    "r9",
    "r10",
    "r11",
    "r12",
    "r13",
    "r14",
    "r15",
    "al",
    "ah",
    "ax",
    "eax",
    "rax",
    "bl",
    "bh",
    "bx",
    "ebx",
    "cl",
    "ch",
    "cx",
    "ecx",
    "dx",
    "dh",
    "dx",
    "edx",
    "si",
    "esi",
    "di",
    "edi",
    "bp",
    "ebp",
    "sp",
    "esp",
    "r8b",
    "r9b",
    "r10b",
    "r11b",
    "r12b",
    "r13b",
    "r14b",
    "r15b",
    "r8w",
    "r9w",
    "r10w",
    "r11w",
    "r12w",
    "r13w",
    "r14w",
    "r15w",
    "r8d",
    "r9d",
    "r10d",
    "r11d",
    "r12d",
    "r13d",
    "r14d",
    "r15d",
    "xmm0",
    "xmm1",
    "xmm2",
    "xmm3",
    "xmm4",
    "xmm5",
    "xmm6",
    "xmm7",
    "xmm8",
    "xmm9",
    "xmm10",
    "xmm11",
    "xmm12",
    "xmm13",
    "xmm14",
    "xmm15",
    "ymm0",
    "ymm1",
    "ymm2",
    "ymm3",
    "ymm4",
    "ymm5",
    "ymm6",
    "ymm7",
    "ymm8",
    "ymm9",
    "ymm10",
    "ymm11",
    "ymm12",
    "ymm13",
    "ymm14",
    "ymm15",
    "zmm0",
    "zmm1",
    "zmm2",
    "zmm3",
    "zmm4",
    "zmm5",
    "zmm6",
    "zmm7",
    "zmm8",
    "zmm9",
    "zmm10",
    "zmm11",
    "zmm12",
    "zmm13",
    "zmm14",
    "zmm15",
    "rip",
    "eip",
    "ip",
    "eflags",
    "rflags",
    "cs",
    "ds",
    "es",
    "fs",
    "gs",
    "ss",
    "fs.base",
    "gs.base",
    "cr0",
    "cr2",
    "cr3",
    "cr4",
    "cr8",
    "dr0",
    "dr1",
    "dr2",
    "dr3",
    "dr6",
    "dr7",
    "tr",
    "ldtr",
    "st0",
    "st1",
    "st2",
    "st3",
    "st4",
    "st5",
    "st6",
    "st7",
    "mm0",
    "mm1",
    "mm2",
    "mm3",
    "mm4",
    "mm5",
    "mm6",
    "mm7",
    "k0",
    "k1",
    "k2",
    "k3",
    "k4",
    "k5",
    "k6",
    "k7",
    "bnd0",
    "bnd1",
    "bnd2",
    "bnd3",
    "bndcfgu",
    "bndstatus",
    "mxcsr",
    "pkru",
    "xcr0",
    "x87",
    "xmm16",
    "xmm17",
    "xmm18",
    "xmm19",
    "xmm20",
    "xmm21",
    "xmm22",
    "xmm23",
];

//const keywords = ["dword", "ptr"];
const operators = ["+", "-", "*", "/", "%", "&", "|", "^", "<", ">", "~", "!", ":", ",", "[", "]", "#", ";"];

export function highlight(text: string) {
    const isInstructionFirst = text.startsWith(" ");
    let isFirstToekn = true;
    let result = "";
    let index = 0;
    while (index < text.length) {
        if (text[index] === " ") {
            result += text[index];
            index++;
        } else if (text[index] === ";" || text[index] === "#") {
            result += `<span class="compiler-explorer-comment">${text.slice(index)}</span>`;
            break;
        } else if (operators.includes(text[index])) {
            result += `<span class="compiler-explorer-operator">${text[index]}</span>`;
            index++;
        } else if (text[index] === '"') {
            let temp = '"';
            index++;
            while (text[index] !== '"' && index < text.length) {
                temp += text[index];
                index++;
            }
            temp += '"';
            index++;
            result += `<span class="compiler-explorer-string">${temp}</span>`;
        } else if (text[index] >= "0" && text[index] <= "9") {
            let temp = text[index];
            index++;
            while (text[index] >= "0" && text[index] <= "9" && index < text.length) {
                temp += text[index];
                index++;
            }
            result += `<span class="compiler-explorer-number">${temp}</span>`;
        } else {
            let temp = text[index];
            index++;
            while (text[index] !== " " && !operators.includes(text[index]) && index < text.length) {
                temp += text[index];
                index++;
            }
            if (isFirstToekn) {
                result += `<span class="compiler-explorer-${
                    isInstructionFirst ? "instruction" : "symbol"
                }">${temp}</span>`;
                isFirstToekn = false;
            } else if (registers.includes(temp)) {
                result += `<span class="compiler-explorer-register">${temp}</span>`;
            } else {
                result += `<span class="compiler-explorer-symbol">${temp}</span>`;
            }
        }
    }
    return result;
}
