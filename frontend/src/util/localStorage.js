import { useState } from "react";

function hasItem(key) {
  const v = localStorage.getItem(key);

  return !(v === null || v === undefined);
}

function getItem(key) {
  const v = localStorage.getItem(key);

  if (typeof v === "string" && (v[0] === "[" || v[1] === "}")) {
    try {
      return JSON.parse(v);
    } catch (err) {
      return;
    }
  }

  return v;
}

function setItem(key, value) {
  if (typeof value === "object") {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, value);
  }
}

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(hasItem(key) ? getItem(key) : defaultValue);

  return [value, v => {
    setItem(key, v);
    setValue(v);
  }];
}
