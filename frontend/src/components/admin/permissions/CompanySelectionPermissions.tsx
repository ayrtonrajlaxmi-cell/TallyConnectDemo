// CompanySelectionPermissions.tsx
import { useState, useEffect } from "react";

interface CompanySelectionPermissionsProps {
  user: any; // User object
  value?: string[]; // List of company IDs or names the user has access to
  onChange: (newPermissions: string[]) => void;
  onDone: () => void;
}

export function CompanySelectionPermissions({
  user,
  value = [],
  onChange,
  onDone,
}: CompanySelectionPermissionsProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(value);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);

 useEffect(() => {
  const fetchCompanies = async () => {
    try {
      const res = await fetch("http://localhost:4000/company", { // <-- updated URL
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setAllCompanies(data.data.map((c: any) => c.name)); // <-- extract data
    } catch (err) {
      console.error("Failed to load companies", err);
    }
  };

  fetchCompanies();
}, []);


  const toggleCompany = (company: string) => {
    const updated = selectedCompanies.includes(company)
      ? selectedCompanies.filter((c) => c !== company)
      : [...selectedCompanies, company];
    setSelectedCompanies(updated);
  };

  const handleSave = () => {
    onChange(selectedCompanies);
    onDone();
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <h2 className="text-lg font-semibold mb-4">Company Access for {user.name}</h2>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
        {allCompanies.map((company) => (
          <label key={company} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedCompanies.includes(company)}
              onChange={() => toggleCompany(company)}
            />
            {company}
          </label>
        ))}
      </div>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
      <button
        onClick={onDone}
        className="ml-2 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}
