export declare const BUNDLED_RUNTIME_PACKAGE_VERSIONS: Readonly<Record<string, string>>;
export declare function parseRuntimePackageName(spec: string): string;
export declare function pinBundledRuntimePackageSpec(spec: string): string;
export declare function pinBundledRuntimePackageSpecs(specs: string[]): string[];
