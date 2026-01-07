import { DataGenerator, DataGeneratorRegistry } from './types';
declare const registry: DataGeneratorRegistry;
export declare function getDataGenerator(indexPattern: string): DataGenerator<any>;
export declare function registerDataGenerator(indexPattern: string, generator: DataGenerator<any>): void;
export default registry;
//# sourceMappingURL=dataGeneratorRegistry.d.ts.map