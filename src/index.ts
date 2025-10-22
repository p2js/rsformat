import { buildString, RsString } from './format';
export { print, println, eprint, eprintln, dbg } from './print';

type ParameterReference = { __rs_param_ref: number };
type rs = {
    (strings: TemplateStringsArray, ...params: any[]): RsString,
    /**
     * Tag to use Rust-style formatting in a template literal.
     * Returns a `string` primitive.
     * 
     * ```js
     * let number = 14;
     * let info = rs.raw`${number+1} is ${rs.ref(0)}:x in hex`; 
     * // info === '15 is f in hex'
     * ``` 
     * 
     * @returns a string primitive of the formatted string
     */
    raw: (strings: TemplateStringsArray, ...params: any[]) => string,
    /**
     * Reference another parameter in a `rs`-tagged template.
     * 
     * @param n Number of parameter to reference
     * @returns A reference to the `n`th parameter
     */
    ref: (n: number) => ParameterReference
}
/**
* Tag to use Rust-style formatting in a template literal.
* Returns an extended `String` object. 
* 
* ```js
* let number = 14;
* let info = rs`${number+1} is ${rs.ref(0)}:x in hex`; 
* // info == '15 is f in hex'
* ```
* 
* @returns a String object with the formatted string
*/
export let rs: rs = ((strings, ...params) => new RsString(strings, params)) as rs
rs.raw = (strings: TemplateStringsArray, ...params: any[]) => buildString(strings, params).raw;
rs.ref = (n: number) => ({ __rs_param_ref: n });