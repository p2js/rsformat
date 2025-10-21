import { RsString } from './format';
import { Writable } from 'node:stream';
import process from 'node:process';
import { rs } from '.';

/**
 * Print a string (or instance of String/RsString) to a stream.
 * 
 * @param stream Stream to print the string to
 * @param string String to print
 * @param newline Whether to append a newline after the string 
 * @param colored Whether to use colors for `rs` debug formatting
 */
export function printToStream(stream: Writable, string: string | String, newline: boolean = false, colored: boolean = false) {
    if (string instanceof String) {
        string = (string as RsString).toString(true);
    }
    if (newline) string = string + '\n';
    stream.write(string);
}
/**
 * Print a string to stdout.
 * 
 * @param string String to print
 */
export function print(string: string | String) {
    printToStream(process.stdout, string, false, true);
}
/**
 * Print a string to stdout and append a newline.
 * 
 * @param string String to print
 */
export function println(string: string | String) {
    printToStream(process.stdout, string, true, true);
}
/**
 * Print a string to stderr.
 * 
 * @param string String to print
 */
export function eprint(string: string | String) {
    printToStream(process.stderr, string, false, true);
}
/**
 * Print a string to stderr and append a newline.
 * 
 * @param string String to print
 */
export function eprintln(string: string | String) {
    printToStream(process.stderr, string, true, true);
}
/**
 * Debug print a value to stderr and return it.
 * 
 * @param value Value to debug print
 */
export function dbg(value: any) {
    eprintln(rs`${value}:?`);
    return value;
}
