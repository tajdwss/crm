
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Shield, Activity, RefreshCw, Play, Eye, Lock, AlertTriangle } from 'lucide-react';

interface TableInfo {
  table_name: string;
  table_schema: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
}

interface QueryResult {
  rows: any[];
  rowCount: number;
}

export default function DbAdmin() {
  const [token, setToken] = useState(localStorage.getItem('db_admin_token') || '');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<{columns: ColumnInfo[], data: any[]}>({ columns: [], data: [] });
  const [customQuery, setCustomQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiCall = async (endpoint: string, options: any = {}) => {
    const response = await fetch(`/api/db-admin${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return response.json();
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const info = await apiCall('/info');
      setTables(info.tables);
      setError('');
      localStorage.setItem('db_admin_token', token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      setLoading(true);
      const data = await apiCall(`/table/${tableName}`);
      setTableData(data);
      setSelectedTable(tableName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/query', {
        method: 'POST',
        body: JSON.stringify({ query: customQuery }),
      });
      setQueryResult(result);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Professional Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Database Administration</h1>
                <p className="text-sm text-gray-600">PostgreSQL Management Console</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="w-3 h-3 mr-1" />
                Secure Access
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                PostgreSQL
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Authentication Section */}
        {!tables.length && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="text-white text-xl" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Secure Database Access</CardTitle>
              <p className="text-gray-600 mt-2">Enter your administrative credentials to access the database management console</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Administrative Token</label>
                  <Input
                    type="password"
                    placeholder="Enter admin authentication token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-12 bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <Button 
                  onClick={loadTables} 
                  disabled={loading || !token}
                  className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Connect to Database
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Tables Section */}
        {tables.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Database Tables</CardTitle>
                  <p className="text-gray-600 mt-1">Browse and manage database schema ({tables.length} tables)</p>
                </div>
                <Button
                  onClick={loadTables}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tables.map((table) => (
                  <Button
                    key={table.table_name}
                    variant={selectedTable === table.table_name ? "default" : "outline"}
                    onClick={() => loadTableData(table.table_name)}
                    className={`h-12 justify-start font-medium ${
                      selectedTable === table.table_name 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
                        : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                    } transition-all duration-200`}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {table.table_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table Data Section */}
        {selectedTable && tableData.columns.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Table: <span className="text-blue-600">{selectedTable}</span>
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{tableData.columns.length} columns • {tableData.data.length} rows displayed</p>
                </div>
                <Button
                  onClick={() => loadTableData(selectedTable)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Refresh Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Column Schema */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Column Schema:</h4>
                <div className="flex flex-wrap gap-2">
                  {tableData.columns.map((col) => (
                    <Badge 
                      key={col.column_name} 
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
                    >
                      <span className="font-medium">{col.column_name}</span>
                      <span className="text-blue-500 ml-1">: {col.data_type}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Data Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        {tableData.columns.map((col) => (
                          <TableHead key={col.column_name} className="font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">
                            {col.column_name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.data.map((row, i) => (
                        <TableRow key={i} className="hover:bg-gray-50">
                          {tableData.columns.map((col) => (
                            <TableCell key={col.column_name} className="border-r border-gray-100 last:border-r-0 font-mono text-sm">
                              {JSON.stringify(row[col.column_name])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SQL Query Section */}
        {tables.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">SQL Query Console</CardTitle>
              <p className="text-gray-600 mt-1">Execute custom SQL queries against the database</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SQL Query</label>
                <Textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  rows={6}
                  placeholder="Enter your SQL query here..."
                  className="font-mono text-sm bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Button 
                onClick={executeQuery} 
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>
              
              {/* Query Results */}
              {queryResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">
                        Query executed successfully
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      {queryResult.rowCount} row(s) affected
                    </Badge>
                  </div>
                  
                  {queryResult.rows.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-auto max-h-96">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              {Object.keys(queryResult.rows[0]).map((key) => (
                                <TableHead key={key} className="font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">
                                  {key}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {queryResult.rows.map((row, i) => (
                              <TableRow key={i} className="hover:bg-gray-50">
                                {Object.entries(row).map(([key, value]) => (
                                  <TableCell key={key} className="border-r border-gray-100 last:border-r-0 font-mono text-sm">
                                    {JSON.stringify(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
