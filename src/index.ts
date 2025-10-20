import { buildString, RsString } from './format';

export { print, println, eprint, eprintln } from './print';

export function rs(strings: TemplateStringsArray, ...params: any[]) {
    return new RsString(strings, params);
}
rs.raw = function (strings: TemplateStringsArray, ...params: any[]) {
    return buildString(strings, params);
}
rs.ref = (n: number) => ({ __rs_param_ref: n });
