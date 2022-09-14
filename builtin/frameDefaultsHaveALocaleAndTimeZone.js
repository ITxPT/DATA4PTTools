/**
 * @name frameDefaultsHaveALocaleAndTimeZone
 * @overview Validates the correctness of DefaultLocale and TimeZone inside FrameDefaults
 * @author Concrete IT
 */
const name = "frameDefaultsHaveALocaleAndTimeZone";
const errors = require("errors");
const time = require("time");
const types = require("types");
const xpath = require("xpath");
const countryCodes = new Set([ // ISO 639-1 country codes
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av",
  "ay", "az", "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo",
  "br", "bs", "ca", "ce", "ch", "co", "cr", "cs", "cu", "cv",
  "cy", "da", "de", "dv", "dz", "ee", "el", "en", "eo", "es",
  "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr", "fy", "ga",
  "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr",
  "ht", "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik",
  "io", "is", "it", "iu", "ja", "jv", "ka", "kg", "ki", "kj",
  "kk", "kl", "km", "kn", "ko", "kr", "ks", "ku", "kv", "kw",
  "ky", "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv",
  "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my",
  "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv",
  "ny", "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps",
  "pt", "qu", "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd",
  "se", "sg", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr",
  "ss", "st", "su", "sv", "sw", "ta", "te", "tg", "th", "ti",
  "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug",
  "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi",
  "yo", "za", "zh", "zu",
]);
const defaultLocalePath = xpath.join(".", "DefaultLocale");
const defaultLangPath = xpath.join(".", "DefaultLanguage");
const tzOffsetPath = xpath.join(".", "TimeZoneOffset");
const stzOffsetPath = xpath.join(".", "SummerTimeZoneOffset");
const tzPath = xpath.join(".", "TimeZone");
const stzPath = xpath.join(".", "SummerTimeZone");

/**
 * Validates the correctness of DefaultLocale and TimeZone inside FrameDefaults
 *
 * The test looks for FrameDefault and if present validates that the
 * DefaultLocale has a valid CountryCode and that the TimeZone have a correct
 * format and value. The TimeZone is validated against IANA Time Zone database
 * (https://www.iana.org/time-zones) and the CountryCode must be in ISO 639-1
 * @param {types.Context} ctx
 * @return {errors.ScriptError[]?}
 */
function main(ctx) {
  const node = ctx.node.first(xpath.path.FRAME_DEFAULTS).get();
  if (!node) {
    return [errors.NotFoundError("Document is missing element <FrameDefaults />")];
  }

  return node.first(defaultLocalePath)
    .map((node) => {
      const res = [];

      if (!validTimeZoneOffset(node.valueAt(tzOffsetPath).get())) {
        res.push(errors.ConsistencyError(
          "Invalid <TimeZoneOffset />",
          { line: node.line() },
        ));
      }

      if (!validTimeZone(node.valueAt(tzPath).get())) {
        res.push(errors.ConsistencyError(
          "Invalid <TimeZone />",
          { line: node.line() },
        ));
      }

      if (!validTimeZoneOffset(node.valueAt(stzOffsetPath).get())) {
        res.push(errors.ConsistencyError(
          "Invalid <SummerTimeZoneOffset />",
          { line: node.line() },
        ));
      }

      if (!validTimeZone(node.valueAt(stzPath).get())) {
        res.push(errors.ConsistencyError(
          "Invalid <SummerTimeZone />",
          { line: node.line() },
        ));
      }

      if (!validLanguage(node.valueAt(defaultLangPath).get())) {
        res.push(errors.ConsistencyError(
          "Invalid <DefaultLanguage />",
          { line: node.line() },
        ));
      }

      return res;
    })
    // @ts-ignore
    .getOrElse(err => {
      if (err == errors.NODE_NOT_FOUND) {
        return [];
      } else if (err) {
        return [errors.GeneralError(err)];
      }
    });
}

/**
 * @param {string} offset
 * @returns {boolean}
 */
function validTimeZoneOffset(offset) {
  if (!offset) {
    return true; // not required according to xsd
  }

  return !!offset.match(/^[\+\-]\d{1,2}$/);
}

/**
 * Validated against IANA Time Zone database (https://www.iana.org/time-zones)
 * @param {string} tz
 * @returns {boolean}
 */
function validTimeZone(tz) {
  if (!tz) {
    return true; // not required according to xsd
  }

  return time.validLocation(tz).getOrElse(() => false);
}

/**
 * @param {string} lang
 * @returns {boolean}
 */
function validLanguage(lang) {
  if (!lang) {
    return true; // not required according to xsd
  }

  return countryCodes.has(lang);
}
