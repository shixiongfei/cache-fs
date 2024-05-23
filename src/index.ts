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
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";
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

const existsFile = async (filename: string) => {
  try {
    await fsp.access(filename);
    return true;
  } catch {
    return false;
  }
};

const ensurePathAsync = async (filename: string) => {
  const filepath = path.dirname(filename);

  if (!(await existsFile(filepath))) {
    await fsp.mkdir(filepath, { recursive: true });
  }

  return filename;
};

const unzip = promisify(zlib.unzip);
const gzip = promisify(zlib.gzip);

export const cacheFsAsync = <T, P extends Array<unknown>>(
  pathGen: (...args: P) => Promise<string> | string,
  fn: (...args: P) => Promise<T> | T,
) => {
  const cachedFn = async (...args: P): Promise<T> => {
    const path = pathGen.apply(this, args);
    const filename = await ensurePathAsync(isPromise(path) ? await path : path);

    if (await existsFile(filename)) {
      const data = await fsp.readFile(filename);
      return decode(await unzip(data));
    } else {
      const result = fn.apply(this, args);
      const retval = isPromise(result) ? await result : result;

      if (retval !== undefined) {
        await fsp.writeFile(filename, await gzip(encode(retval)));
      }
      return retval;
    }
  };
  return cachedFn;
};
