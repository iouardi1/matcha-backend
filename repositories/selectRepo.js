const db = require('../db/db')

async function select(tableName, fields, conditionFields) {
    try {
        var selectClause
        var conditionClause

        if (fields.length > 1)
            selectClause = fields.map((field) => `${field} `).join(', ')
        else selectClause = fields.map((field) => `${field} `)

        if (conditionFields > 1) {
            conditionClause = conditionFields.map(
                (field) => `${field[0]} = '${field[1]}' `
            )
        } else {
            conditionClause = conditionFields.map((field) => {
                if (typeof field[1] === 'string') {
                    return `${field[0]} = '${field[1]}' `
                } else return `${field[0]} = ${field[1]} `
            })
        }
        const queryText = `SELECT ${selectClause} FROM ${tableName} WHERE ${conditionClause}`
        const { rows } = await db.query(queryText)
        return rows[0]
    } catch (err) {
        console.error('Error executing select query', err)
        throw err
    }
}

module.exports = select
