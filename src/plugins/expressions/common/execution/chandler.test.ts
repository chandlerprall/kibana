/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { createUnitTestExecutor } from '../test_helpers';
import { Datatable, ExpressionFunctionDefinition } from '../../public';
import { getFunctionErrors, getFunctionHelp } from '../../../../../x-pack/plugins/canvas/i18n/functions';

beforeAll(() => {
  if (typeof performance === 'undefined') {
    (global as any).performance = { now: Date.now };
  }
});

const dummydata: ExpressionFunctionDefinition<'dummydata', any, {}, any> = {
  name: 'dummydata',
  args: {},
  help: '',
  fn: (input) => {
    const rows = [];
    for (let i = 0; i < 3000; i++) {
      rows.push({
        char: String.fromCharCode(Math.round(Math.random() * 26) + 65)
      });
    }

    return {
      type: 'datatable',
      columns: [
        { name: 'char', type: 'string' }
      ],
      rows,
    }
  },
};

interface FilterrowsArguments {
  fn: (datatable: Datatable) => Promise<boolean>;
}
function filterrows(): ExpressionFunctionDefinition<
  'filterrows',
  Datatable,
  FilterrowsArguments,
  Promise<Datatable>
  > {
  const { help, args: argHelp } = getFunctionHelp().filterrows;

  return {
    name: 'filterrows',
    aliases: [],
    type: 'datatable',
    inputTypes: ['datatable'],
    help,
    args: {
      fn: {
        resolve: false,
        aliases: ['_', 'exp', 'expression', 'function'],
        types: ['boolean'],
        required: true,
        help: argHelp.fn,
      },
    },
    fn(input, { fn }) {
      const checks = input.rows.map(row => {
        return fn({
          ...input,
          rows: [row],
        });
      });

      const validRows = input.rows.filter((row, i) => checks[i]);
      return {
        ...input,
        rows: validRows,
      } as Datatable;
      // return Promise.all(checks)
      //   .then(results => input.rows.filter((row, i) => results[i]))
      //   .then(
      //     rows =>
      //       ({
      //         ...input,
      //         rows,
      //       } as Datatable)
      //   );
    },
  };
}

interface GetCellArguments {
  column: string;
  row: number;
}

export function getCell(): ExpressionFunctionDefinition<'getCell', Datatable, GetCellArguments, any> {
  const { help, args: argHelp } = getFunctionHelp().getCell;
  const errors = getFunctionErrors().getCell;

  return {
    name: 'getCell',
    help,
    inputTypes: ['datatable'],
    args: {
      column: {
        types: ['string'],
        aliases: ['_', 'c'],
        help: argHelp.column,
      },
      row: {
        types: ['number'],
        aliases: ['r'],
        help: argHelp.row,
        default: 0,
      },
    },
    fn: (input, args) => {
      const row = input.rows[args.row];
      if (!row) {
        throw errors.rowNotFound(args.row);
      }

      const { column = input.columns[0].name } = args;
      const value = row[column];

      if (typeof value === 'undefined') {
        throw errors.columnNotFound(column);
      }

      return value;
    },
  };
}

interface EqArguments {
  value: Input;
}

type Input = boolean | number | string | null;

export function eq(): ExpressionFunctionDefinition<'eq', Input, EqArguments, boolean> {
  const { help, args: argHelp } = getFunctionHelp().eq;

  return {
    name: 'eq',
    type: 'boolean',
    inputTypes: ['boolean', 'number', 'string', 'null'],
    help,
    args: {
      value: {
        aliases: ['_'],
        types: ['boolean', 'number', 'string', 'null'],
        required: true,
        help: argHelp.value,
      },
    },
    fn: (input, args) => {
      return input === args.value;
    },
  };
}

interface AnyArguments {
  condition: boolean[];
}

export function any(): ExpressionFunctionDefinition<'any', null, AnyArguments, boolean> {
  const { help, args: argHelp } = getFunctionHelp().any;

  return {
    name: 'any',
    type: 'boolean',
    inputTypes: ['null'],
    help,
    args: {
      condition: {
        aliases: ['_'],
        types: ['boolean'],
        required: true,
        multi: true,
        help: argHelp.condition,
      },
    },
    fn: (input, args) => {
      const conditions = args.condition || [];
      return conditions.some(Boolean);
    },
  };
}


describe('Execution', () => {
  test('executes a chain of multiple "add" functions', async () => {
    const executor = createUnitTestExecutor();
    executor.registerFunction(dummydata);
    executor.registerFunction(filterrows);
    executor.registerFunction(getCell);
    executor.registerFunction(eq);
    executor.registerFunction(any);

    debugger;
    const start = Date.now();
    const result = await executor.run(
      'dummydata | filterrows {getCell "char" | any {eq "A"} {eq "D"} {eq "C"}}',
      null
    );
    const end = Date.now();
    debugger;

    console.log('found', result.rows.length);
    console.log(end-start);
  });
});
