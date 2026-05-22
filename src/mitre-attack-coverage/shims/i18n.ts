/**
 * STUB: replaces @kbn/i18n
 * Returns defaultMessage so strings render correctly without Kibana's i18n runtime.
 */
export const i18n = {
  translate: (_id: string, opts: { defaultMessage: string; values?: Record<string, unknown> }): string => {
    let msg = opts.defaultMessage;
    if (opts.values) {
      Object.entries(opts.values).forEach(([k, v]) => {
        msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return msg;
  },
};
