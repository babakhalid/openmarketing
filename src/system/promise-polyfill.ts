// Promise.withResolvers for Node.js versions that lack it; preloaded into the Pi process by launch.ts.

type PromiseWithResolvers<T> = {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

declare global {
	interface PromiseConstructor {
		withResolvers?<T>(): PromiseWithResolvers<T>;
	}
}

if (typeof Promise.withResolvers !== "function") {
	Promise.withResolvers = function withResolvers<T>(): PromiseWithResolvers<T> {
		let resolve!: (value: T | PromiseLike<T>) => void;
		let reject!: (reason?: unknown) => void;
		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	};
}

export {};

