const name = "frame-defaults";
const description = "Validates consistency of DefaultLocale inside FrameDefaults element (if present)";
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
  const frameDefaults = ctx.xpath.first(frameDefaultsPath);
  if (!frameDefaults) {
    return ["Document is missing element FrameDefaults"];
  }

  const errors = [];

  // not to bothered by errors since its optional according to  xsd schema
  let defaultLocale = ctx.xpath.first(defaultLocalePath, frameDefaults);
  if (defaultLocale) {
    if (!validTimeZoneOffset(ctx.xpath.findValue(tzOffsetPath, defaultLocale))) {
      errors.push("Invalid TimeZoneOffset");
    }

    if (!validTimeZone(ctx.xpath.findValue(tzPath, defaultLocale))) {
      errors.push("Invalid TimeZone");
    }

    if (!validTimeZoneOffset(ctx.xpath.findValue(stzOffsetPath, defaultLocale))) {
      errors.push("Invalid SummerTimeZoneOffset");
    }

    if (!validTimeZone(ctx.xpath.findValue(stzPath, defaultLocale))) {
      errors.push("Invalid SummerTimeZone");
    }

    if (!validLanguage(ctx.xpath.findValue(defaultLangPath, defaultLocale))) {
      errors.push("Invalid DefaultLanguage");
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
