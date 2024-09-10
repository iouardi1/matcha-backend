const db = require("../db/db");

async function insertOne(tableName, fields, values) {
	try {
		var setClause;
		var valueClause;

		if (fields.length > 1)
			setClause = fields.map((field) => `${field}`).join(", ");
		else setClause = fields.map((field) => `${field}`);

		valueClause = values.map((field) => {
			if (typeof field === "string") {
				return `'${field}' `;
			} else return `${field}`;
		});

		const queryText = `INSERT INTO ${tableName} (${setClause}) VALUES (${valueClause})`;

		const { rows } = await db.query(queryText);
		return rows[0];
	} catch (err) {
		console.error("Error executing insert query", err);
		throw err;
	}
}

async function insertMany(tableName, fields, values) {
	try {
		var setClause;
		var valueClause;

		if (fields.length > 1)
			setClause = fields.map((field) => `${field}`).join(", ");
		else setClause = fields.map((field) => `${field}`);

		valueClause = values.map((field, index) => {
			return field.map((subField, index) => {
				if (typeof subField === "string") {
					if (index == 0) return `('${subField}' `;
					if (index == field.length - 1) return `'${subField}') `;
					return `'${subField}' `;
				} else {
					if (index == 0) return `(${subField} `;
					if (index == field.length - 1) return `${subField}) `;
					return `${subField} `;
				}
			});
		});

		const queryText = `INSERT INTO ${tableName} (${setClause}) VALUES ${valueClause}`;
		const { rows } = await db.query(queryText);
		return rows[0];
	} catch (err) {
		console.error("Error executing insert query", err);
		throw err;
	}
}

module.exports = { insertOne, insertMany };
