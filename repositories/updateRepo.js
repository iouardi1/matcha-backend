const db = require("../db/db");

async function update(tableName, fields, values, conditionFields) {
	try {
		var setClause;
		var conditionClause;

		if (fields.length > 1)
			setClause = fields
				.map((field, index) => `${field}=$${index + 1}`)
				.join(", ");
		else setClause = fields.map((field, index) => `${field}=$${index + 1}`);

		if (conditionFields > 1) {
			conditionClause = conditionFields.map(
				(field) => `${field[0]} = '${field[1]}' `,
			);
		} else {
			conditionClause = conditionFields.map((field) => {
				if (typeof field[1] === "string") {
					return `${field[0]} = '${field[1]}' `;
				} else return `${field[0]} = ${field[1]} `;
			});
		}

		const queryText = `UPDATE ${tableName} SET ${setClause} WHERE ${conditionClause} RETURNING *`;
		const queryParams = [...values];

		const { rows } = await db.query(queryText, queryParams);
		return rows[0];
	} catch (err) {
		console.error("Error executing update query", err);
		throw err;
	}
}

module.exports = update;
