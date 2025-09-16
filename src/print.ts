import { Writable } from 'node:stream';
import process from 'node:process';
import { fmt_raw } from './format';

/**
 * Create format printer functions with custom output/error streams.
 * 
 * @param outStream Output stream (used by print and println - process.stdout by default)
 * @param errStream Error stream (used by eprint and eprintln - process.stderr by default)
 * @param options Options for the printer functions (Whether to color the debug formatting in the output - true by default)
 * 
 * @returns an object with print, println, eprint and eprintln functions that print to the specified streams
 */
export function Printer(outStream: Writable = process.stdout, errStream: Writable = process.stderr, options = { debugColors: true }) {
    return {
        /**
         * Print a format string to an output stream (usually process.stdout).
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        print: function print(format_string: string, ...params: any[]) {
            outStream.write(fmt_raw(format_string, params, { colors: options.debugColors }));
        },
        /**
         * Print a format string to an output stream (usually process.stdout)
         * and append a newline.
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        println: function println(format_string: string, ...params: any[]) {
            outStream.write(fmt_raw(format_string, params, { colors: options.debugColors }) + '\n');
        },
        /**
         * Print a format string to an error stream (usually process.stderr).
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        eprint: function eprint(format_string: string, ...params: any[]) {
            errStream.write(fmt_raw(format_string, params, { colors: options.debugColors }));
        },
        /**
         * Print a format string to an error stream (usually process.stderr)
         * and append a newline.
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        eprintln: function eprintln(format_string: string, ...params: any[]) {
            errStream.write(fmt_raw(format_string, params, { colors: options.debugColors }) + '\n');
        },
    }
}

const default_printer = Printer();
/**
 * Print a format string to process.stdout.
 * 
 * @param format_string String used for formatting
 * @param params Parameters to be inserted into the format string
 */
export const print = default_printer.print;
/**
 * Print a format string to process.stdout
 * and append a newline.
 * 
 * @param format_string String used for formatting
 * @param params Parameters to be inserted into the format string
 */
export const println = default_printer.println;
/**
 * Print a format string to process.stderr.
 * 
 * @param format_string String used for formatting
 * @param params Parameters to be inserted into the format string
 */
export const eprint = default_printer.eprint;
/**
 * Print a format string to process.stderr
 * and append a newline.
 * 
 * @param format_string String used for formatting
 * @param params Parameters to be inserted into the format string
 */
export const eprintln = default_printer.eprintln;