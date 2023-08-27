/*
 * index.ts
 *
 * Copyright (c) 2023 Xiongfei Shi
 *
 * Author: Xiongfei Shi <xiongfei.shi(a)icloud.com>
 * License: Apache-2.0
 *
 * https://github.com/shixiongfei/cache-fs
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { encode, decode } from "@msgpack/msgpack";

export const ensurePath = (filename: string) => {
  const filepath = path.dirname(filename);

  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }

  return filename;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPromise = (value: any): boolean =>
  value && value instanceof Promise;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cacheFs = <T extends (...args: any[]) => any>(
  pathGen: (...args: Parameters<T>) => string,
  fn: T,
): T => {
  const cachedFn = (...args: Parameters<T>) => {
    const filename = ensurePath(pathGen.apply(this, args));

    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename);
      return decode(zlib.unzipSync(data)) as ReturnType<T>;
    } else {
      const result = fn.apply(this, args);

      if (result !== undefined) {
        fs.writeFileSync(filename, zlib.gzipSync(encode(result)));
      }
      return result as ReturnType<T>;
    }
  };
  return cachedFn as T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cacheFsAsync = <T extends (...args: any[]) => Promise<any>>(
  pathGen: (...args: Parameters<T>) => Promise<string> | string,
  fn: T,
): T => {
  const cachedFn = async (...args: Parameters<T>) => {
    const path = pathGen.apply(this, args);
    const filename = ensurePath(
      (isPromise(path) ? await path : path) as Awaited<string>,
    );

    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename);
      return decode(zlib.unzipSync(data)) as Awaited<ReturnType<T>>;
    } else {
      const result = fn.apply(this, args);
      const retval = isPromise(result) ? await result : result;

      if (retval !== undefined) {
        fs.writeFileSync(filename, zlib.gzipSync(encode(retval)));
      }
      return retval as Awaited<ReturnType<T>>;
    }
  };
  return cachedFn as T;
};
