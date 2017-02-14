System.import('src/client/workspaces.js').then(m=>{
	m.setCode('1', "console.log(3+4)");
	m.setCode('2', "export function foo() { console.log('foo'); return 3; }");
	m.setCode('3', "import { foo } from 'workspace:2'; console.log(foo());");

  System.import('workspace:3')
});

