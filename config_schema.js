module.exports = {
  definitions: {
    host       : {
      type     : 'string',
      minLength: 1
    },
    port       : {
      type: ['integer', 'string']
    },
    password   : {
      type: 'string'
    },
    db_number  : {
      type: ['integer', 'string']
    },
    key_prefix : {
      type     : 'string',
      minLength: 1
    },
    validateKey: {}
  },
  oneOf      : [
    {
      type                : 'object',
      additionalProperties: false,
      required            : ['db_number', 'validateKey', 'sentinel_options'],
      properties          : {
        db_number       : {
          $ref: '#/definitions/db_number'
        },
        validateKey     : {
          $ref: '#/definitions/validateKey'
        },
        key_prefix      : {
          $ref: '#/definitions/key_prefix'
        },
        sentinel_options: {
          type                : 'object',
          required            : ['name', 'sentinels'],
          additionalProperties: false,
          properties          : {
            name     : {
              type     : 'string',
              minLength: 1
            },
            sentinels: {
              type    : 'array',
              minItems: 1,
              items   : {
                type                : 'object',
                required            : ['host', 'port'],
                additionalProperties: false,
                properties          : {
                  host    : {
                    $ref: '#/definitions/host'
                  },
                  port    : {
                    $ref: '#/definitions/port'
                  },
                  password: {
                    $ref: '#/definitions/password'
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      type                : 'object',
      additionalProperties: false,
      required            : ['host', 'port', 'db_number', 'validateKey'],
      properties          : {
        host       : {
          $ref: '#/definitions/host'
        },
        port       : {
          $ref: '#/definitions/port'
        },
        password   : {
          $ref: '#/definitions/password'
        },
        db_number  : {
          $ref: '#/definitions/db_number'
        },
        key_prefix : {
          $ref: '#/definitions/key_prefix'
        },
        validateKey: {
          $ref: '#/definitions/validateKey'
        }
      }
    }
  ]
};