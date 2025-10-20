import { setDebugColors } from './format';
import { Writable } from 'node:stream';
import process from 'node:process';

export function printToStream(stream: Writable, string: string | String, newline: boolean = false, colored: boolean = false) {
    if (string instanceof String) {
        if (colored) setDebugColors(true);
        string = string.toString();
        setDebugColors(false);
    }
    if (newline) string = string + '\n';
    stream.write(string);
}

export function print(string: string | String) {
    printToStream(process.stdout, string, false, true);
}
export function println(string: string | String) {
    printToStream(process.stdout, string, true, true);
}
export function eprint(string: string | String) {
    printToStream(process.stderr, string, false, true);
}
export function eprintln(string: string | String) {
    printToStream(process.stderr, string, true, true);
}
