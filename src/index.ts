/*
 * index.ts
 *
 * Copyright (c) 2023-2024 Xiongfei Shi
 *
 * Author: Xiongfei Shi <xiongfei.shi(a)icloud.com>
 * License: Apache-2.0
 *
 * https://github.com/shixiongfei/cache-fs
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { isPromise } from "node:util/types";
import { encode, decode } from "msgpackr";

const ensurePath = (filename: string) => {
  const filepath = path.dirname(filename);

  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }

  return filename;
};

export const cacheFs = <T, P extends Array<unknown>>(
  pathGen: (...args: P) => string,
  fn: (...args: P) => T,
) => {
  const cachedFn = (...args: P): T => {
    const filename = ensurePath(pathGen.apply(this, args));

    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename);
      return decode(zlib.unzipSync(data));
    } else {
      const result = fn.apply(this, args);

      if (result !== undefined) {
        fs.writeFileSync(filename, zlib.gzipSync(encode(result)));
      }
      return result;
    }
  };
  return cachedFn;
};

export const cacheFsAsync = <T, P extends Array<unknown>>(
  pathGen: (...args: P) => Promise<string> | string,
  fn: (...args: P) => Promise<T> | T,
) => {
  const cachedFn = async (...args: P): Promise<T> => {
    const path = pathGen.apply(this, args);
    const filename = ensurePath(isPromise(path) ? await path : path);

    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename);
      return decode(zlib.unzipSync(data));
    } else {
      const result = fn.apply(this, args);
      const retval = isPromise(result) ? await result : result;

      if (retval !== undefined) {
        fs.writeFileSync(filename, zlib.gzipSync(encode(retval)));
      }
      return retval;
    }
  };
  return cachedFn;
};
