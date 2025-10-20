import { buildString, RsString } from './format';
export { print, println, eprint, eprintln } from './print';
/**
 * Tag to use Rust-style formatting in a template literal.
 * Returns an extended `String` object. 
 * 
 * @returns a String object with the formatted string
 */
export function rs(strings: TemplateStringsArray, ...params: any[]) {
    return new RsString(strings, params);
}
/**
 * Tag to use Rust-style formatting in a template literal.
 * Returns a `string` primitive.
 * 
 * @returns a string primitive of the formatted string
 */
rs.raw = function (strings: TemplateStringsArray, ...params: any[]) {
    return buildString(strings, params);
}
/**
 * Reference another parameter in a `rs`-tagged template.
 * 
 * @param n Number of parameter to reference
 * @returns A reference to the `n`th parameter
 */
rs.ref = (n: number) => ({ __rs_param_ref: n });
