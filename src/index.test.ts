/*
 * index.test.ts
 *
 * Copyright (c) 2023-2024 Xiongfei Shi
 *
 * Author: Xiongfei Shi <xiongfei.shi(a)icloud.com>
 * License: Apache-2.0
 *
 * https://github.com/shixiongfei/cache-fs
 */

import { cacheFs, cacheFsAsync } from "./index.js";

const generate = (kind: string, a: number, b: number) => {
  const time = new Date().getTime();
  return { kind, a, b, time };
};

const oneTwo = cacheFs(
  (a, b) => `./cache/sync/${a}_${b}`,
  (a: number, b: number) => generate("sync", a, b),
);

const oneTwoAsync = cacheFsAsync(
  (a, b) => `./cache/async/${a}_${b}`,
  async (a: number, b: number) => generate("async", a, b),
);

const test = async () => {
  console.log(oneTwo(1, 2));
  console.log(oneTwo(4, 7));
  console.log(oneTwo(6, 8));

  console.log(await oneTwoAsync(2, 3));
  console.log(await oneTwoAsync(5, 9));
  console.log(await oneTwoAsync(8, 0));
};

test();
