import { useState, useEffect } from 'react';

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

export function useFormConfig(formId: string) {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('formConfigs');
    if (saved) {
      const configs: FormConfig[] = JSON.parse(saved);
      const config = configs.find(c => c.id === formId);
      setFormConfig(config || null);
    }
  }, [formId]);

  return formConfig;
}