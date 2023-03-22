import { LwcConfig, ModuleRecord, NpmModuleRecord, DirModuleRecord, AliasModuleRecord, ModuleResolverConfig, RegistryEntry, InnerResolverOptions, RegistryType } from './types';
export declare function isNpmModuleRecord(moduleRecord: ModuleRecord): moduleRecord is NpmModuleRecord;
export declare function isDirModuleRecord(moduleRecord: ModuleRecord): moduleRecord is DirModuleRecord;
export declare function isAliasModuleRecord(moduleRecord: ModuleRecord): moduleRecord is AliasModuleRecord;
export declare function getModuleEntry(moduleDir: string, moduleName: string, opts: InnerResolverOptions): string;
export declare function normalizeConfig(config: Partial<ModuleResolverConfig>, scope: string): ModuleResolverConfig;
export declare function mergeModules(userModules: ModuleRecord[], configModules?: ModuleRecord[]): ModuleRecord[];
export declare function findFirstUpwardConfigPath(dirname: string): string;
export declare function validateNpmConfig(config: LwcConfig, opts: InnerResolverOptions): asserts config is Required<LwcConfig>;
export declare function validateNpmAlias(exposed: string[], map: {
    [key: string]: string;
}, opts: InnerResolverOptions): void;
export declare function getLwcConfig(dirname: string): LwcConfig;
export declare function createRegistryEntry(entry: string, specifier: string, type: RegistryType, opts: InnerResolverOptions): RegistryEntry;
export declare function remapList(exposed: string[], map: {
    [key: string]: string;
}): string[];
export declare function transposeObject(map: {
    [key: string]: string;
}): {
    [key: string]: string;
};
