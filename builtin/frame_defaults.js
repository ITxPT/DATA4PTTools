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
function main(context) {
  const { log, nodeContext } = context;
  const [frameDefaults, fdErr] = xpath.first(nodeContext, ".//netex:FrameDefaults");
  if (fdErr) {
    return [fdErr];
  }

  if (!frameDefaults) {
    return ["Document is missing element FrameDefaults"];
  }

  const errors = [];

  // since this is a single element per document there's no reason to run it in a worker
  setContextNode(nodeContext, frameDefaults);

  // not to bothered by errors since its optional according to  xsd schema
  let [defaultLocale] = xpath.first(nodeContext, "./netex:DefaultLocale");
  if (defaultLocale) {
    setContextNode(nodeContext, defaultLocale);

    const [tzo] = xpath.findValue(nodeContext, "./netex:TimeZoneOffset");
    if (tzo && !validTimeZoneOffset(tzo)) {
      errors.push("Invalid TimeZoneOffset");
    }

    const [tz] = xpath.findValue(nodeContext, "./netex:TimeZone");
    if (tz && !validTimeZone(tz)) {
      errors.push("Invalid TimeZone");
    }

    const [stzo] = xpath.findValue(nodeContext, "./netex:SummerTimeZoneOffset");
    if (stzo && !validTimeZoneOffset(stzo)) {
      errors.push("Invalid SummerTimeZoneOffset");
    }

    const [stz] = xpath.findValue(nodeContext, "./netex:SummerTimeZone");
    if (stz && !validTimeZone(stz)) {
      errors.push("Invalid SummerTimeZone");
    }

    const [lang] = xpath.findValue(nodeContext, "./netex:DefaultLanguage");
    if (lang && !validLanguage(lang)) {
      errors.push("Invalid DefaultLanguage");
    }
  }

  if (errors.length === 0) {
    log.info("validation without any errors");
  } else {
    log.info("validation completed with '%d' errors", errors.length);
  }

  return errors;
}

function validTimeZoneOffset(offset) {
  return offset.match(/^[\+\-]\d{1,2}$/);
}

// validated against IANA Time Zone database (https://www.iana.org/time-zones)
function validTimeZone(tz) {
  const [valid] = time.validLocation(tz);

  return valid;
}

function validLanguage(lang) {
  return countryCodes.includes(lang);
}
