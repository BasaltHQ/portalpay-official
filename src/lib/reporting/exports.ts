// Utility functions for exporting data to CSV, XLSX, and PDF (client-side)
// All heavy libraries are dynamically imported to avoid SSR issues

export function exportCSV(filename: string, rows: Array<Record<string, any>>): void {
	if (!Array.isArray(rows)) rows = [];
	const allKeys = rows.flatMap(row => Object.keys(row || {}));
	const headers = Array.from(new Set(allKeys));
	const escape = (val: any) => {
		const s = val === null || val === undefined ? '' : String(val);
		if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
		return s;
	};
	let csv = '';
	csv += headers.join(',') + '\n';
	for (const row of rows) {
		csv += headers.map(h => escape(row[h])).join(',') + '\n';
	}
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
}

export async function exportXLSX(filename: string, sheetName: string, rows: Array<Record<string, any>>): Promise<void> {
	const XLSX = await import('xlsx');
	const ws = XLSX.utils.json_to_sheet(rows || []);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
	const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
	const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
	link.click();
	URL.revokeObjectURL(link.href);
}

export async function exportXLSXMulti(filename: string, sheets: Array<{ name: string; rows: Array<Record<string, any>> }>): Promise<void> {
	const XLSX = await import('xlsx');
	const wb = XLSX.utils.book_new();
	for (const s of sheets) {
		const ws = XLSX.utils.json_to_sheet(s.rows || []);
		XLSX.utils.book_append_sheet(wb, ws, s.name || 'Sheet');
	}
	const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
	const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
	link.click();
	URL.revokeObjectURL(link.href);
}

export async function exportPDFTable(
	filename: string,
	title: string,
	columns: Array<{ header: string; dataKey: string }>,
	rows: Array<Record<string, any>>
): Promise<void> {
	const jsPDFMod = await import('jspdf');
	const autoTableMod = await import('jspdf-autotable');
	const jsPDF = jsPDFMod.default || (jsPDFMod as any);
	const doc = new jsPDF({ orientation: 'landscape' });
	(doc as any).setFontSize(14);
	(doc as any).text(title || 'Report', 14, 16);
	(autoTableMod as any).default(doc, {
		head: [columns.map(c => c.header)],
		body: (rows || []).map(r => columns.map(c => r[c.dataKey])),
		styles: { fontSize: 8 },
		startY: 22,
	});
	doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export async function exportPDFReport(
	filename: string,
	sections: Array<{ title: string; columns: Array<{ header: string; dataKey: string }>; rows: Array<Record<string, any>> }>
): Promise<void> {
	const jsPDFMod = await import('jspdf');
	const autoTableMod = await import('jspdf-autotable');
	const jsPDF = jsPDFMod.default || (jsPDFMod as any);
	const doc = new jsPDF({ orientation: 'landscape' });
	let first = true;
	for (const sec of sections) {
		if (!first) (doc as any).addPage();
		first = false;
		(doc as any).setFontSize(14);
		(doc as any).text(sec.title || 'Section', 14, 16);
		(autoTableMod as any).default(doc, {
			head: [sec.columns.map(c => c.header)],
			body: (sec.rows || []).map(r => sec.columns.map(c => r[c.dataKey])),
			styles: { fontSize: 8 },
			startY: 22,
		});
	}
	(doc as any).save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function rowsFromObjectArray<T extends Record<string, any>>(arr: T[], pick?: string[]): Array<Record<string, any>> {
	if (!Array.isArray(arr)) return [];
	if (!pick || pick.length === 0) return arr.map(x => ({ ...x }));
	return arr.map(x => pick.reduce((o, k) => (o[k] = x[k], o), {} as Record<string, any>));
}


