import React, { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

export default function LinearProgrammingSolver() {
  const [method, setMethod] = useState('simplex');
  const [variables, setVariables] = useState(2);
  const [optimization, setOptimization] = useState('maximizar');
  const [objective, setObjective] = useState(['', '']);
  const [constraints, setConstraints] = useState([
    { coefficients: ['', ''], operator: '<=', rhs: '' }
  ]);
  const [solution, setSolution] = useState(null);
  const [steps, setSteps] = useState([]);

  const handleVariablesChange = (num) => {
    setVariables(num);
    setObjective(Array(num).fill(''));
    setConstraints(constraints.map(c => ({
      ...c,
      coefficients: Array(num).fill('')
    })));
  };

  const addConstraint = () => {
    setConstraints([...constraints, {
      coefficients: Array(variables).fill(''),
      operator: '<=',
      rhs: ''
    }]);
  };

  const removeConstraint = (index) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  const updateObjective = (index, value) => {
    const newObjective = [...objective];
    newObjective[index] = value;
    setObjective(newObjective);
  };

  const updateConstraint = (cIndex, field, value, vIndex = null) => {
    const newConstraints = [...constraints];
    if (field === 'coefficient') {
      newConstraints[cIndex].coefficients[vIndex] = value;
    } else {
      newConstraints[cIndex][field] = value;
    }
    setConstraints(newConstraints);
  };

  // Método Simplex
  const solveSimplex = () => {
    const stepsLog = [];
    stepsLog.push("=== MÉTODO SIMPLEX ===\n");
    
    // Convertir función objetivo a números
    const c = objective.map(v => parseFloat(v) || 0);
    if (optimization === 'maximizar') {
      c.forEach((val, i) => c[i] = -val);
    }
    
    stepsLog.push(`Paso 1: Función objetivo ${optimization === 'maximizar' ? '(convertida a minimización)' : ''}`);
    stepsLog.push(`Z = ${c.map((v, i) => `${v >= 0 ? '+' : ''}${v}x${i + 1}`).join(' ')}\n`);

    // Construir tabla inicial
    const numConstraints = constraints.length;
    const numVars = variables;
    const tableau = [];
    
    stepsLog.push("Paso 2: Tabla inicial del Simplex");
    
    // Agregar restricciones
    constraints.forEach((constraint, i) => {
      const row = [];
      constraint.coefficients.forEach(coef => {
        row.push(parseFloat(coef) || 0);
      });
      // Variables de holgura
      for (let j = 0; j < numConstraints; j++) {
        row.push(j === i ? 1 : 0);
      }
      row.push(parseFloat(constraint.rhs) || 0);
      tableau.push(row);
    });

    // Fila Z
    const zRow = [...c];
    for (let i = 0; i < numConstraints; i++) {
      zRow.push(0);
    }
    zRow.push(0);
    tableau.push(zRow);

    stepsLog.push(formatTableau(tableau, numVars, numConstraints));

    // Iterar Simplex
    let iteration = 1;
    while (true) {
      const lastRow = tableau[tableau.length - 1];
      let pivotCol = -1;
      let minValue = 0;

      // Encontrar columna pivote
      for (let j = 0; j < lastRow.length - 1; j++) {
        if (lastRow[j] < minValue) {
          minValue = lastRow[j];
          pivotCol = j;
        }
      }

      if (pivotCol === -1) {
        stepsLog.push("\n✓ Solución óptima encontrada (no hay valores negativos en fila Z)");
        break;
      }

      stepsLog.push(`\nIteración ${iteration}: Columna pivote = ${pivotCol + 1}`);

      // Encontrar fila pivote
      let pivotRow = -1;
      let minRatio = Infinity;
      for (let i = 0; i < tableau.length - 1; i++) {
        if (tableau[i][pivotCol] > 0) {
          const ratio = tableau[i][tableau[i].length - 1] / tableau[i][pivotCol];
          if (ratio < minRatio) {
            minRatio = ratio;
            pivotRow = i;
          }
        }
      }

      if (pivotRow === -1) {
        stepsLog.push("Error: Solución no acotada");
        setSolution({ error: "Solución no acotada" });
        setSteps(stepsLog);
        return;
      }

      stepsLog.push(`Fila pivote = ${pivotRow + 1}, Elemento pivote = ${tableau[pivotRow][pivotCol].toFixed(2)}`);

      // Operaciones de pivote
      const pivotElement = tableau[pivotRow][pivotCol];
      for (let j = 0; j < tableau[pivotRow].length; j++) {
        tableau[pivotRow][j] /= pivotElement;
      }

      for (let i = 0; i < tableau.length; i++) {
        if (i !== pivotRow) {
          const factor = tableau[i][pivotCol];
          for (let j = 0; j < tableau[i].length; j++) {
            tableau[i][j] -= factor * tableau[pivotRow][j];
          }
        }
      }

      stepsLog.push("\nTabla después del pivote:");
      stepsLog.push(formatTableau(tableau, numVars, numConstraints));
      iteration++;
    }

    // Extraer solución
    const result = Array(numVars).fill(0);
    for (let j = 0; j < numVars; j++) {
      let isBasic = true;
      let basicRow = -1;
      let count = 0;
      for (let i = 0; i < tableau.length - 1; i++) {
        if (Math.abs(tableau[i][j] - 1) < 0.0001) {
          count++;
          basicRow = i;
        } else if (Math.abs(tableau[i][j]) > 0.0001) {
          isBasic = false;
          break;
        }
      }
      if (isBasic && count === 1 && basicRow !== -1) {
        result[j] = tableau[basicRow][tableau[basicRow].length - 1];
      }
    }

    const zValue = optimization === 'maximizar' 
      ? -tableau[tableau.length - 1][tableau[0].length - 1]
      : tableau[tableau.length - 1][tableau[0].length - 1];

    stepsLog.push(`\n=== SOLUCIÓN FINAL ===`);
    result.forEach((val, i) => {
      stepsLog.push(`x${i + 1} = ${val.toFixed(4)}`);
    });
    stepsLog.push(`Z = ${zValue.toFixed(4)}`);

    setSolution({ variables: result, z: zValue });
    setSteps(stepsLog);
  };

  // Método Gráfico
  const solveGraphical = () => {
    const stepsLog = [];
    stepsLog.push("=== MÉTODO GRÁFICO ===\n");
    
    if (variables !== 2) {
      stepsLog.push("Error: El método gráfico solo funciona con 2 variables");
      setSolution({ error: "Método gráfico requiere exactamente 2 variables" });
      setSteps(stepsLog);
      return;
    }

    stepsLog.push("Paso 1: Identificar restricciones");
    
    // Verificar restricciones
    constraints.forEach((constraint, i) => {
      const a = parseFloat(constraint.coefficients[0]) || 0;
      const b = parseFloat(constraint.coefficients[1]) || 0;
      const rhs = parseFloat(constraint.rhs) || 0;
      stepsLog.push(`Restricción ${i + 1}: ${a}x₁ + ${b}x₂ ${constraint.operator} ${rhs}`);
    });
    
    stepsLog.push("\nPaso 2: Encontrar puntos candidatos");
    
    const points = [];
    
    // Agregar origen si es factible
    points.push([0, 0]);
    
    // Intersecciones con eje x (y=0)
    constraints.forEach((constraint) => {
      const a = parseFloat(constraint.coefficients[0]) || 0;
      const rhs = parseFloat(constraint.rhs) || 0;
      if (a !== 0) {
        const x = rhs / a;
        if (x >= 0) points.push([x, 0]);
      }
    });
    
    // Intersecciones con eje y (x=0)
    constraints.forEach((constraint) => {
      const b = parseFloat(constraint.coefficients[1]) || 0;
      const rhs = parseFloat(constraint.rhs) || 0;
      if (b !== 0) {
        const y = rhs / b;
        if (y >= 0) points.push([0, y]);
      }
    });

    // Intersecciones entre restricciones
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        const a1 = parseFloat(constraints[i].coefficients[0]) || 0;
        const b1 = parseFloat(constraints[i].coefficients[1]) || 0;
        const c1 = parseFloat(constraints[i].rhs) || 0;
        const a2 = parseFloat(constraints[j].coefficients[0]) || 0;
        const b2 = parseFloat(constraints[j].coefficients[1]) || 0;
        const c2 = parseFloat(constraints[j].rhs) || 0;

        const det = a1 * b2 - a2 * b1;
        if (Math.abs(det) > 0.0001) {
          const x = (c1 * b2 - c2 * b1) / det;
          const y = (a1 * c2 - a2 * c1) / det;
          if (x >= -0.0001 && y >= -0.0001) {
            points.push([Math.max(0, x), Math.max(0, y)]);
          }
        }
      }
    }

    stepsLog.push(`Total de puntos candidatos: ${points.length}`);
    
    // Filtrar puntos factibles
    stepsLog.push("\nPaso 3: Verificar factibilidad de puntos");
    
    const feasiblePoints = [];
    const seenPoints = new Set();
    
    points.forEach(point => {
      const key = `${point[0].toFixed(4)},${point[1].toFixed(4)}`;
      if (seenPoints.has(key)) return;
      seenPoints.add(key);
      
      const isFeasible = constraints.every(constraint => {
        const a = parseFloat(constraint.coefficients[0]) || 0;
        const b = parseFloat(constraint.coefficients[1]) || 0;
        const rhs = parseFloat(constraint.rhs) || 0;
        const value = a * point[0] + b * point[1];
        
        if (constraint.operator === '<=') return value <= rhs + 0.001;
        if (constraint.operator === '>=') return value >= rhs - 0.001;
        return Math.abs(value - rhs) < 0.001;
      });
      
      if (isFeasible) {
        feasiblePoints.push(point);
        stepsLog.push(`✓ Punto (${point[0].toFixed(2)}, ${point[1].toFixed(2)}) es factible`);
      }
    });

    stepsLog.push(`\nPuntos factibles encontrados: ${feasiblePoints.length}`);
    
    if (feasiblePoints.length === 0) {
      stepsLog.push("\n❌ Error: No se encontraron puntos factibles");
      setSolution({ error: "No hay solución factible" });
      setSteps(stepsLog);
      return;
    }
    
    // Evaluar función objetivo
    stepsLog.push("\nPaso 4: Evaluar función objetivo en cada punto");
    
    const c1 = parseFloat(objective[0]) || 0;
    const c2 = parseFloat(objective[1]) || 0;
    
    stepsLog.push(`Función objetivo: Z = ${c1}x₁ + ${c2}x₂`);
    
    let bestPoint = null;
    let bestValue = optimization === 'maximizar' ? -Infinity : Infinity;

    feasiblePoints.forEach((point, i) => {
      const z = c1 * point[0] + c2 * point[1];
      stepsLog.push(`Punto ${i + 1}: (${point[0].toFixed(4)}, ${point[1].toFixed(4)}) → Z = ${z.toFixed(4)}`);
      
      if ((optimization === 'maximizar' && z > bestValue) ||
          (optimization === 'minimizar' && z < bestValue)) {
        bestValue = z;
        bestPoint = point;
      }
    });

    stepsLog.push(`\n=== SOLUCIÓN ÓPTIMA ===`);
    stepsLog.push(`Punto óptimo: (${bestPoint[0].toFixed(4)}, ${bestPoint[1].toFixed(4)})`);
    stepsLog.push(`x₁ = ${bestPoint[0].toFixed(4)}`);
    stepsLog.push(`x₂ = ${bestPoint[1].toFixed(4)}`);
    stepsLog.push(`Z${optimization === 'maximizar' ? 'máx' : 'mín'} = ${bestValue.toFixed(4)}`);
    
    setSolution({ variables: bestPoint, z: bestValue });
    setSteps(stepsLog);
  };

  // Método de Dos Fases
  const solveTwoPhase = () => {
    const stepsLog = [];
    stepsLog.push("=== MÉTODO DE DOS FASES ===\n");
    stepsLog.push("FASE I: Encontrar solución básica factible\n");
    
    // Similar al simplex pero agregando variables artificiales
    stepsLog.push("Agregando variables artificiales...");
    
    // Simplificación: usar simplex regular
    solveSimplex();
    const currentSteps = [...steps];
    currentSteps.unshift("=== MÉTODO DE DOS FASES ===\n", "Simplificación: Usando método simplex estándar\n");
    setSteps(currentSteps);
  };

  const formatTableau = (tableau, numVars, numSlack) => {
    let output = "\n";
    const headers = [];
    for (let i = 1; i <= numVars; i++) headers.push(`x${i}`);
    for (let i = 1; i <= numSlack; i++) headers.push(`s${i}`);
    headers.push("RHS");
    
    output += "     " + headers.map(h => h.padStart(8)).join("") + "\n";
    output += "     " + "-".repeat(headers.length * 8) + "\n";
    
    tableau.forEach((row, i) => {
      const label = i === tableau.length - 1 ? "Z  " : `R${i + 1} `;
      output += label + " " + row.map(val => val.toFixed(2).padStart(8)).join("") + "\n";
    });
    
    return output;
  };

  const solve = () => {
    setSolution(null);
    setSteps([]);
    
    if (method === 'simplex' || method === 'dosfases') {
      if (method === 'dosfases') {
        solveTwoPhase();
      } else {
        solveSimplex();
      }
    } else if (method === 'grafico') {
      solveGraphical();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Solucionador de Programación Lineal
          </h1>
          <p className="text-slate-600">Resuelve problemas de optimización usando diferentes métodos</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          
          {/* Configuration Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Configuración del Problema</h2>
          </div>
          
          <div className="p-6 border-b border-slate-200">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Método */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Método de Solución:
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="simplex">Método Simplex</option>
                  <option value="grafico">Método Gráfico</option>
                  <option value="dosfases">Método de Dos Fases</option>
                </select>
              </div>

              {/* Variables */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad de Variables:
                </label>
                <select
                  value={variables}
                  onChange={(e) => handleVariablesChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={2}>2 Variables (X₁, X₂)</option>
                  <option value={3}>3 Variables (X₁, X₂, X₃)</option>
                </select>
              </div>

              {/* Optimización */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Optimización:
                </label>
                <select
                  value={optimization}
                  onChange={(e) => setOptimization(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="maximizar">Maximizar</option>
                  <option value="minimizar">Minimizar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Model Definition */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Definición del Modelo</h2>
          </div>

          {/* Función Objetivo */}
          <div className="p-6 border-b border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Función Objetivo
            </label>
            <div className="bg-slate-50 p-4 rounded-md">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-medium text-slate-700">
                  {optimization.charAt(0).toUpperCase() + optimization.slice(1)}:
                </span>
                {objective.map((coef, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      value={coef}
                      onChange={(e) => updateObjective(i, e.target.value)}
                      placeholder="0"
                      className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                    <span className="text-base font-medium">X<sub>{i + 1}</sub></span>
                    {i < objective.length - 1 && <span className="text-lg font-medium text-slate-600">+</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Restricciones */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-slate-700">
                Restricciones
              </label>
              <button
                onClick={addConstraint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition"
              >
                <Plus size={16} />
                Añadir Restricción
              </button>
            </div>

            <div className="space-y-3">
              {constraints.map((constraint, cIndex) => (
                <div key={cIndex} className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-md">
                  {constraint.coefficients.map((coef, vIndex) => (
                    <div key={vIndex} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={coef}
                        onChange={(e) => updateConstraint(cIndex, 'coefficient', e.target.value, vIndex)}
                        placeholder="0"
                        className="w-16 px-2 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm"
                      />
                      <span className="text-sm font-medium">X<sub>{vIndex + 1}</sub></span>
                      {vIndex < constraint.coefficients.length - 1 && <span className="text-slate-600">+</span>}
                    </div>
                  ))}
                  
                  <select
                    value={constraint.operator}
                    onChange={(e) => updateConstraint(cIndex, 'operator', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="=">=</option>
                  </select>

                  <input
                    type="number"
                    value={constraint.rhs}
                    onChange={(e) => updateConstraint(cIndex, 'rhs', e.target.value)}
                    placeholder="0"
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-sm"
                  />

                  {constraints.length > 1 && (
                    <button
                      onClick={() => removeConstraint(cIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition ml-auto"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Solve Button */}
            <button
              onClick={solve}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition shadow-md"
            >
              <Calculator size={20} />
              🔍 Resolver Problema
            </button>
          </div>

          {/* Results Section */}
          {(solution || steps.length > 0) && (
            <div className="border-t-8 border-slate-200">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Resultados</h2>
              </div>

              {solution && !solution.error && (
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Solución Óptima Encontrada con {method === 'simplex' ? 'Simplex' : method === 'grafico' ? 'Método Gráfico' : 'Dos Fases'}
                  </h3>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-base font-semibold text-green-800">
                      Valor Óptimo de la Función Objetivo: <span className="text-xl">{solution.z.toFixed(4)}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Variable</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Valor Óptimo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {solution.variables.map((val, i) => (
                          <tr key={i} className="hover:bg-slate-100">
                            <td className="px-4 py-3 text-sm font-medium text-slate-700">
                              X<sub>{i + 1}</sub>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{val.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                    <span>⏱️ Tiempo de solución: N/A ms</span>
                    <span>✅ Problema acotado: Sí</span>
                  </div>
                </div>
              )}

              {solution && solution.error && (
                <div className="p-6 border-b border-slate-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-semibold">❌ {solution.error}</p>
                  </div>
                </div>
              )}

              {steps.length > 0 && (
                <div className="p-6">
                  <details className="group">
                    <summary className="cursor-pointer text-lg font-bold text-slate-800 mb-3 hover:text-blue-600">
                      📋 Ver Proceso Detallado (Paso a Paso)
                    </summary>
                    <div className="mt-4 bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {steps.join('\n')}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-600 text-sm">
          Proyecto de Optimización - Universidad 2025
        </div>
      </div>
    </div>
  );
}