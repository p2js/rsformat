import { Writable } from 'node:stream';
import process from 'node:process';
import { format } from './format';

export function Printer(outStream: Writable = process.stdout, errStream: Writable = process.stderr) {
    return {
        /**
         * Print a format string to an output stream (usually process.stdout).
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        print: function print(format_string: string, ...params: any[]) {
            outStream.write(format(format_string, ...params));
        },
        /**
         * Print a format string to an output stream (usually process.stdout)
         * and append a newline.
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        println: function println(format_string: string, ...params: any[]) {
            outStream.write(format(format_string, ...params) + '\n');
        },
        /**
         * Print a format string to an error stream (usually process.stderr).
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        eprint: function eprint(format_string: string, ...params: any[]) {
            errStream.write(format(format_string, ...params));
        },
        /**
         * Print a format string to an error stream (usually process.stderr)
         * and append a newline.
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        eprintln: function eprintln(format_string: string, ...params: any[]) {
            errStream.write(format(format_string, ...params) + '\n');
        },
    }
}

export const { print, println, eprint, eprintln } = Printer();