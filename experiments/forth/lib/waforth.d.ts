/**
 * Creates a function that accepts character codes in UTF-8 encoding, and calls
 * the callback whenever a complete character is received.
 */
export declare function withCharacterBuffer(fn: (c: string) => void): (c: number) => void;
/**
 * Creates a function that accepts character codes in UTF-8 encoding, and calls
 * the callback whenever a complete newline-delimited line is received.
 *
 * The resulting function also has a `flush()` function to flush any remaining output.
 */
export declare function withLineBuffer(fn: (c: string) => void): {
    (c: number): void;
    flush: () => void;
};
export declare enum ErrorCode {
    Unknown = 1,
    Quit = 2,
    Abort = 3,
    EOI = 4,
    Bye = 5
}
export declare function isSuccess(code: ErrorCode): boolean;
/**
 * JavaScript shell around the WAForth WebAssembly module.
 *
 * Provides higher-level functions to interact with the WAForth WebAssembly module.
 *
 * To the WebAssembly module, provides the infrastructure to dynamically load WebAssembly modules and
 * the I/O primitives with the UI.
 * */
declare class WAForth {
    #private;
    core?: WebAssembly.Instance;
    /**
     * Callback that is called when a character needs to be emitted.
     *
     * `c` is the single-character string that is emitted
     */
    onEmit?: (c: number) => void;
    key: () => number;
    constructor();
    /**
     * Initialize WAForth.
     *
     * Needs to be called before interpret().
     */
    load(): Promise<this>;
    memory(): WebAssembly.Memory;
    here(): number;
    pop(): number;
    popString(): string;
    push(n: number): void;
    pushString(s: string, offset?: number): number;
    /**
     * Read data `s` into the input buffer without interpreting it.
     */
    read(s: string): void;
    /**
     * Read data `s` into the input buffer, and start interpreter.
     */
    interpret(s: string, silent?: boolean): any;
    /**
     * Bind `name` to SCALL in Forth.
     *
     * When an SCALL is done with `name` on the top of the stack, `fn` will be called (with the name popped off the stack).
     * Use `stack` to pop parameters off the stack, and push results back on the stack.
     */
    bind(name: string, fn: (f: WAForth) => void): void;
    /**
     * Bind async `name` to SCALL in Forth.
     *
     * When an SCALL is done with `name` on the top of the stack, `fn` will be called (with the name popped off the stack).
     * Expects an execution token on the top of the stack, which will be called when the async callback is finished.
     * The execution parameter will be called with the success flag set.
     */
    bindAsync(name: string, fn: (f: WAForth) => Promise<void>): void;
}
export default WAForth;
