C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\utils\errors.js:130
    throw error;
    ^

Error: Cannot find module 'expo-router/_ctx-shared'
Require stack:
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\router-server\build\typed-routes\index.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\type-generation\routes.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\type-generation\startTypescriptTypeGeneration.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\metro\MetroBundlerDevServer.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\DevServerManager.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\startAsync.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\index.js
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\bin\cli
- C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\expo\bin\cli
    at Function._resolveFilename (node:internal/modules/cjs/loader:1430:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1040:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1045:22)
    at Function._load (node:internal/modules/cjs/loader:1216:25)
    at wrapModuleLoad (node:internal/modules/cjs/loader:254:19)
    at Module.require (node:internal/modules/cjs/loader:1527:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\router-server\build\typed-routes\index.js:8:23)
    at Module._compile (node:internal/modules/cjs/loader:1781:14)
    at Object..js (node:internal/modules/cjs/loader:1913:10)
    at Module.load (node:internal/modules/cjs/loader:1505:32)
    at Function._load (node:internal/modules/cjs/loader:1309:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:254:19)
    at Module.require (node:internal/modules/cjs/loader:1527:12)
    at require (node:internal/modules/helpers:147:16)
    at typedRoutes (C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\type-generation\routes.js:77:31)
    at setupTypedRoutes (C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\type-generation\routes.js:69:12)
    at startTypescriptTypeGenerationAsync (C:\Users\admin\Desktop\Fullstack-Nordi-Remittance\Frontend-Nordi-Remittance\node_modules\@expo\cli\build\src\start\server\type-generation\startTypescriptTypeGeneration.js:67:42) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\router-server\\build\\typed-routes\\index.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\src\\start\\server\\type-generation\\routes.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\src\\start\\server\\type-generation\\startTypescriptTypeGeneration.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\src\\start\\server\\metro\\MetroBundlerDevServer.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\src\\start\\server\\DevServerManager.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\src\\start\\startAsync.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\src\\start\\index.js',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\@expo\\cli\\build\\bin\\cli',
    'C:\\Users\\admin\\Desktop\\Fullstack-Nordi-Remittance\\Frontend-Nordi-Remittance\\node_modules\\expo\\bin\\cli'
  ]
}

Node.js v22.23.3
make: *** [Makefile:16: start-clean] Error 7