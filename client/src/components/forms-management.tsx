import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Eye, Settings, FileText, Package, User, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "tel" | "email" | "date";
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface FormConfig {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

const defaultFormConfigs: FormConfig[] = [
  {
    id: "service-request",
    name: "Service Request Form",
    description: "Customer service request form for device repairs",
    fields: [
      { id: "customerName", label: "Customer Name", type: "text", required: true, placeholder: "Enter your full name" },
      { id: "mobile", label: "Mobile Number", type: "tel", required: true, placeholder: "Enter your mobile number", validation: { minLength: 10, maxLength: 10 } },
      { id: "location", label: "Service Location", type: "textarea", required: true, placeholder: "Enter your complete address where service is required" },
      { id: "product", label: "Device/Product Type", type: "select", required: true, options: ["Mobile Phone", "Laptop", "Desktop Computer", "Tablet", "Television", "Air Conditioner", "Refrigerator", "Washing Machine", "Microwave", "Printer", "Other Electronics"] },
      { id: "issueDescription", label: "Issue Description", type: "textarea", required: true, placeholder: "Describe the problem with your device in detail" },
      { id: "priority", label: "Priority Level", type: "select", required: false, options: ["Low", "Normal", "High"] }
    ]
  },
  {
    id: "receipt-form",
    name: "Receipt Entry Form",
    description: "Form for creating new repair receipts",
    fields: [
      { id: "customerName", label: "Customer Name", type: "text", required: true, placeholder: "Enter customer name" },
      { id: "mobile", label: "Mobile Number", type: "tel", required: true, placeholder: "Enter mobile number" },
      { id: "isCompanyItem", label: "Company Item", type: "checkbox", required: false },
      { id: "product", label: "Product Type", type: "text", required: true, placeholder: "e.g., Mobile Phone, Laptop, Tablet" },
      { id: "model", label: "Model", type: "text", required: false, placeholder: "Enter device model" },
      { id: "problemDescription", label: "Problem Description", type: "textarea", required: false, placeholder: "Describe the issue" },
      { id: "estimatedAmount", label: "Estimated Amount (₹)", type: "number", required: false, placeholder: "Enter estimated repair cost" },
      { id: "estimatedDeliveryDate", label: "Estimated Delivery Date", type: "date", required: false }
    ]
  },
  {
    id: "work-assignment",
    name: "Work Assignment Form",
    description: "Form for creating work assignments",
    fields: [
      { id: "assignedTo", label: "Assign To", type: "select", required: true, options: [] },
      { id: "workType", label: "Work Type", type: "select", required: true, options: ["receipt", "service", "maintenance"] },
      { id: "workId", label: "Work ID", type: "text", required: true, placeholder: "Enter work ID" },
      { id: "priority", label: "Priority", type: "select", required: true, options: ["low", "medium", "high", "urgent"] },
      { id: "assignmentNotes", label: "Assignment Notes", type: "textarea", required: false, placeholder: "Add any instructions or notes" },
      { id: "dueDate", label: "Due Date", type: "date", required: false }
    ]
  }
];

export function FormsManagement() {
  const [formConfigs, setFormConfigs] = useState<FormConfig[]>(() => {
    const saved = localStorage.getItem('formConfigs');
    return saved ? JSON.parse(saved) : defaultFormConfigs;
  });
  const [selectedForm, setSelectedForm] = useState<string>("service-request");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newField, setNewField] = useState<FormField>({
    id: "",
    label: "",
    type: "text",
    required: false
  });
  const [showAddField, setShowAddField] = useState(false);
  const { toast } = useToast();

  const saveFormConfigs = (configs: FormConfig[]) => {
    setFormConfigs(configs);
    localStorage.setItem('formConfigs', JSON.stringify(configs));
    toast({
      title: "Forms Updated",
      description: "Form configurations have been saved successfully.",
    });
  };

  const currentForm = formConfigs.find(f => f.id === selectedForm);

  const addField = () => {
    if (!newField.id || !newField.label) {
      toast({
        title: "Error",
        description: "Field ID and Label are required.",
        variant: "destructive"
      });
      return;
    }

    const updatedConfigs = formConfigs.map(form => {
      if (form.id === selectedForm) {
        return {
          ...form,
          fields: [...form.fields, { ...newField, id: newField.id.toLowerCase().replace(/\s+/g, '') }]
        };
      }
      return form;
    });

    saveFormConfigs(updatedConfigs);
    setNewField({ id: "", label: "", type: "text", required: false });
    setShowAddField(false);
  };

  const updateField = (fieldId: string, updatedField: FormField) => {
    const updatedConfigs = formConfigs.map(form => {
      if (form.id === selectedForm) {
        return {
          ...form,
          fields: form.fields.map(field => 
            field.id === fieldId ? updatedField : field
          )
        };
      }
      return form;
    });

    saveFormConfigs(updatedConfigs);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    if (confirm("Are you sure you want to delete this field?")) {
      const updatedConfigs = formConfigs.map(form => {
        if (form.id === selectedForm) {
          return {
            ...form,
            fields: form.fields.filter(field => field.id !== fieldId)
          };
        }
        return form;
      });

      saveFormConfigs(updatedConfigs);
    }
  };

  const addOption = (fieldId: string, option: string) => {
    if (!option.trim()) return;

    const updatedConfigs = formConfigs.map(form => {
      if (form.id === selectedForm) {
        return {
          ...form,
          fields: form.fields.map(field => {
            if (field.id === fieldId) {
              return {
                ...field,
                options: [...(field.options || []), option.trim()]
              };
            }
            return field;
          })
        };
      }
      return form;
    });

    saveFormConfigs(updatedConfigs);
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const updatedConfigs = formConfigs.map(form => {
      if (form.id === selectedForm) {
        return {
          ...form,
          fields: form.fields.map(field => {
            if (field.id === fieldId) {
              return {
                ...field,
                options: field.options?.filter((_, index) => index !== optionIndex)
              };
            }
            return field;
          })
        };
      }
      return form;
    });

    saveFormConfigs(updatedConfigs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Forms Management</h2>
          <p className="text-gray-600">Customize and manage all application forms</p>
        </div>
      </div>

      <Tabs value={selectedForm} onValueChange={setSelectedForm}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="service-request" className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Service Request</span>
          </TabsTrigger>
          <TabsTrigger value="receipt-form" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Receipt Form</span>
          </TabsTrigger>
          <TabsTrigger value="work-assignment" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Work Assignment</span>
          </TabsTrigger>
        </TabsList>

        {formConfigs.map(form => (
          <TabsContent key={form.id} value={form.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{form.name}</span>
                  <Button
                    onClick={() => setShowAddField(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-600">{form.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{field.type}</Badge>
                          <span className="font-medium">{field.label}</span>
                          {field.required && <Badge variant="destructive">Required</Badge>}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingField(field.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteField(field.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {editingField === field.id ? (
                        <FieldEditor
                          field={field}
                          onSave={(updatedField) => updateField(field.id, updatedField)}
                          onCancel={() => setEditingField(null)}
                          onAddOption={(option) => addOption(field.id, option)}
                          onRemoveOption={(index) => removeOption(field.id, index)}
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>ID: {field.id}</p>
                          {field.placeholder && <p>Placeholder: {field.placeholder}</p>}
                          {field.options && field.options.length > 0 && (
                            <p>Options: {field.options.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add New Field Modal */}
      {showAddField && (
        <Card className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Field</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddField(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field ID</Label>
                  <Input
                    value={newField.id}
                    onChange={(e) => setNewField({...newField, id: e.target.value})}
                    placeholder="fieldId"
                  />
                </div>
                <div>
                  <Label>Field Label</Label>
                  <Input
                    value={newField.label}
                    onChange={(e) => setNewField({...newField, label: e.target.value})}
                    placeholder="Field Label"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field Type</Label>
                  <Select
                    value={newField.type}
                    onValueChange={(value: any) => setNewField({...newField, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    checked={newField.required}
                    onCheckedChange={(checked) => setNewField({...newField, required: !!checked})}
                  />
                  <Label>Required Field</Label>
                </div>
              </div>

              <div>
                <Label>Placeholder</Label>
                <Input
                  value={newField.placeholder || ""}
                  onChange={(e) => setNewField({...newField, placeholder: e.target.value})}
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddField(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addField}>
                  Add Field
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface FieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onCancel: () => void;
  onAddOption: (option: string) => void;
  onRemoveOption: (index: number) => void;
}

function FieldEditor({ field, onSave, onCancel, onAddOption, onRemoveOption }: FieldEditorProps) {
  const [editField, setEditField] = useState<FormField>(field);
  const [newOption, setNewOption] = useState("");

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Label</Label>
          <Input
            value={editField.label}
            onChange={(e) => setEditField({...editField, label: e.target.value})}
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={editField.type}
            onValueChange={(value: any) => setEditField({...editField, type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="tel">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Placeholder</Label>
        <Input
          value={editField.placeholder || ""}
          onChange={(e) => setEditField({...editField, placeholder: e.target.value})}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={editField.required}
          onCheckedChange={(checked) => setEditField({...editField, required: !!checked})}
        />
        <Label>Required Field</Label>
      </div>

      {editField.type === "select" && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {editField.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input value={option} readOnly className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveOption(index)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex space-x-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add new option"
                className="flex-1"
              />
              <Button
                onClick={() => {
                  onAddOption(newOption);
                  setNewOption("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(editField)}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}