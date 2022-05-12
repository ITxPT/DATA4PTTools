// ***************************************************************************
//  Data4PT NeTEx Validator
//
//  Rule        : frameDefaultsHaveALocaleAndTimeZone
//  Description : Validates the correctness of DefaultLocale and TimeZone inside FrameDefaults
//
//  Author      : Concrete IT on behalf of Data4PT
// ***************************************************************************

const name = "frameDefaultsHaveALocaleAndTimeZone";
const description = `Validates the correctness of DefaultLocale and TimeZone inside FrameDefaults

The test looks for FrameDefault and if present validates that the DefaultLocale has a valid CountryCode and that the TimeZone have a correct format and value.
The TimeZone is validated against IANA Time Zone database (https://www.iana.org/time-zones) and the CountryCode must be in ISO 639-1`;
const countryCodes = [ // ISO 639-1 country codes
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
];
const xpath = require("xpath");
const time = require("time");
const frameDefaultsPath = xpath.join("./", "FrameDefaults");
const defaultLocalePath = xpath.join(".", "DefaultLocale");
const defaultLangPath = xpath.join(".", "DefaultLanguage");
const tzOffsetPath = xpath.join(".", "TimeZoneOffset");
const stzOffsetPath = xpath.join(".", "SummerTimeZoneOffset");
const tzPath = xpath.join(".", "TimeZone");
const stzPath = xpath.join(".", "SummerTimeZone");

/**
 * _example structure_
 * ```xml
 *  <FrameDefaults>
 *    <DefaultLocale>
 *      <TimeZone>Europe/Stockholm</TimeZone>
 *      <DefaultLanguage>se</DefaultLanguage>
 *    </DefaultLocale>
 *  </FrameDefaults>
 * ```
 **/

function main(ctx) {
  const errors = [];
  const frameDefaults = ctx.xpath.first(frameDefaultsPath);
  if (!frameDefaults) {
    return [{
      type: "not_found",
      message: "Document is missing element FrameDefaults",
    }];
  }

  // not to bothered by errors since its optional according to  xsd schema
  const defaultLocale = ctx.xpath.first(defaultLocalePath, frameDefaults);
  const line = ctx.xpath.line(defaultLocale)
  if (defaultLocale) {
    if (!validTimeZoneOffset(ctx.xpath.findValue(tzOffsetPath, defaultLocale))) {
      errors.push({
        type: "consistency",
        message: "Invalid TimeZoneOffset",
        line,
      });
    }

    if (!validTimeZone(ctx.xpath.findValue(tzPath, defaultLocale))) {
      errors.push({
        type: "consistency",
        message: "Invalid TimeZone",
        line,
      });
    }

    if (!validTimeZoneOffset(ctx.xpath.findValue(stzOffsetPath, defaultLocale))) {
      errors.push({
        type: "consistency",
        message: "Invalid SummerTimeZoneOffset",
        line,
      });
    }

    if (!validTimeZone(ctx.xpath.findValue(stzPath, defaultLocale))) {
      errors.push({
        type: "consistency",
        message: "Invalid SummerTimeZone",
        line,
      });
    }

    if (!validLanguage(ctx.xpath.findValue(defaultLangPath, defaultLocale))) {
      errors.push({
        type: "consistency",
        message: "Invalid DefaultLanguage",
        line: line,
      });
    }
  }

  return errors;
}

function validTimeZoneOffset(offset) {
  if (!offset) {
    return true; // not required according to xsd
  }

  return offset.match(/^[\+\-]\d{1,2}$/);
}

// validated against IANA Time Zone database (https://www.iana.org/time-zones)
function validTimeZone(tz) {
  if (!tz) {
    return true; // not required according to xsd
  }

  const [valid] = time.validLocation(tz);

  return valid;
}

function validLanguage(lang) {
  if (!lang) {
    return true; // not required according to xsd
  }

  return countryCodes.includes(lang);
}
