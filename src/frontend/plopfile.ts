//import { NodePlopAPI } from 'node-plop';

export default function (plop: NodePlopAPI) {
  plop.setGenerator('component', {
    description: 'Generate a React component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is your component name?',
      },
      {
        type: 'confirm',
        name: 'includeTypes',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeStyles',
        default: false,
      },
    ],
    actions: (data) => {
      const actions = [];

      // Determine which .tsx template to use
      let tsxTemplate = 'plop-templates/component.tsx.hbs'; // Default: no types, no styles
      if (data.includeTypes && data.includeStyles) {
        tsxTemplate = 'plop-templates/component-type-style.tsx.hbs';
      } else if (data.includeTypes) {
        tsxTemplate = 'plop-templates/component-type.tsx.hbs';
      } else if (data.includeStyles) {
        tsxTemplate = 'plop-templates/component-style.tsx.hbs';
      }

      // Core files (always included)
      actions.push({
        type: 'add',
        path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: tsxTemplate,
      });
      actions.push({
        type: 'add',
        path: 'src/components/{{pascalCase name}}/index.ts',
        templateFile: 'plop-templates/index.ts.hbs',
      });

      // Conditional: Types file
      if (data.includeTypes) {
        actions.push({
          type: 'add',
          path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.types.ts',
          templateFile: 'plop-templates/component.types.ts.hbs',
        });
      }

      // Conditional: Styles file
      if (data.includeStyles) {
        actions.push({
          type: 'add',
          path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.module.css',
          templateFile: 'plop-templates/component.module.css.hbs',
        });
      }
      return actions;
    } 
  });
  plop.setGenerator('page', {
    description: 'Generate a React Page',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is your page name?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: 'plop-templates/page.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/{{pascalCase name}}.css',
        templateFile: 'plop-templates/page.css.hbs',
      },
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}/index.ts',
        templateFile: 'plop-templates/index.ts.hbs',
      },
    ],
  });
}
