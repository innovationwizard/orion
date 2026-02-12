| table_schema | table_name          | ordinal_position | column_name               | data_type                | is_nullable | column_default               |
| ------------ | ------------------- | ---------------- | ------------------------- | ------------------------ | ----------- | ---------------------------- |
| public       | audit_log           | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | audit_log           | 2                | table_name                | text                     | NO          | null                         |
| public       | audit_log           | 3                | record_id                 | uuid                     | NO          | null                         |
| public       | audit_log           | 4                | action                    | USER-DEFINED             | NO          | null                         |
| public       | audit_log           | 5                | old_data                  | jsonb                    | YES         | null                         |
| public       | audit_log           | 6                | new_data                  | jsonb                    | YES         | null                         |
| public       | audit_log           | 7                | changed_by                | text                     | NO          | null                         |
| public       | audit_log           | 8                | changed_at                | timestamp with time zone | NO          | now()                        |
| public       | audit_log           | 9                | row_version               | integer                  | NO          | 1                            |
| public       | cash_flow_forecast  | 1                | due_date                  | date                     | YES         | null                         |
| public       | cash_flow_forecast  | 2                | month                     | timestamp with time zone | YES         | null                         |
| public       | cash_flow_forecast  | 3                | week                      | timestamp with time zone | YES         | null                         |
| public       | cash_flow_forecast  | 4                | project_name              | text                     | YES         | null                         |
| public       | cash_flow_forecast  | 5                | installments_due          | bigint                   | YES         | null                         |
| public       | cash_flow_forecast  | 6                | expected_amount           | numeric                  | YES         | null                         |
| public       | cash_flow_forecast  | 7                | historical_compliance_pct | numeric                  | YES         | null                         |
| public       | cash_flow_forecast  | 8                | forecasted_amount         | numeric                  | YES         | null                         |
| public       | clients             | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | clients             | 2                | full_name                 | text                     | NO          | null                         |
| public       | clients             | 3                | tax_id                    | text                     | YES         | null                         |
| public       | clients             | 4                | email                     | text                     | YES         | null                         |
| public       | clients             | 5                | phone                     | text                     | YES         | null                         |
| public       | clients             | 6                | created_at                | timestamp with time zone | NO          | now()                        |
| public       | clients             | 7                | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | clients             | 8                | row_version               | integer                  | NO          | 1                            |
| public       | commission_phases   | 1                | phase                     | integer                  | NO          | null                         |
| public       | commission_phases   | 2                | name                      | text                     | NO          | null                         |
| public       | commission_phases   | 3                | percentage                | numeric                  | NO          | null                         |
| public       | commission_phases   | 4                | description               | text                     | NO          | null                         |
| public       | commission_phases   | 5                | row_version               | integer                  | NO          | 1                            |
| public       | commission_rates    | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | commission_rates    | 2                | recipient_id              | text                     | NO          | null                         |
| public       | commission_rates    | 3                | recipient_name            | text                     | NO          | null                         |
| public       | commission_rates    | 4                | rate                      | numeric                  | NO          | null                         |
| public       | commission_rates    | 5                | recipient_type            | text                     | NO          | null                         |
| public       | commission_rates    | 6                | description               | text                     | NO          | null                         |
| public       | commission_rates    | 7                | always_paid               | boolean                  | NO          | false                        |
| public       | commission_rates    | 8                | active                    | boolean                  | NO          | true                         |
| public       | commission_rates    | 9                | created_at                | timestamp with time zone | NO          | now()                        |
| public       | commission_rates    | 10               | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | commission_rates    | 11               | row_version               | integer                  | NO          | 1                            |
| public       | commissions         | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | commissions         | 2                | payment_id                | uuid                     | NO          | null                         |
| public       | commissions         | 3                | sale_id                   | uuid                     | NO          | null                         |
| public       | commissions         | 4                | recipient_id              | text                     | NO          | null                         |
| public       | commissions         | 5                | recipient_name            | text                     | NO          | null                         |
| public       | commissions         | 6                | phase                     | integer                  | NO          | null                         |
| public       | commissions         | 7                | rate                      | numeric                  | NO          | null                         |
| public       | commissions         | 8                | base_amount               | numeric                  | NO          | null                         |
| public       | commissions         | 9                | commission_amount         | numeric                  | NO          | null                         |
| public       | commissions         | 10               | paid                      | boolean                  | NO          | false                        |
| public       | commissions         | 11               | paid_date                 | date                     | YES         | null                         |
| public       | commissions         | 12               | created_at                | timestamp with time zone | NO          | now()                        |
| public       | commissions         | 13               | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | commissions         | 14               | status                    | USER-DEFINED             | NO          | 'pending'::commission_status |
| public       | commissions         | 15               | row_version               | integer                  | NO          | 1                            |
| public       | delinquent_accounts | 1                | project_name              | text                     | YES         | null                         |
| public       | delinquent_accounts | 2                | unit_number               | text                     | YES         | null                         |
| public       | delinquent_accounts | 3                | client_name               | text                     | YES         | null                         |
| public       | delinquent_accounts | 4                | expected_installments     | bigint                   | YES         | null                         |
| public       | delinquent_accounts | 5                | expected_total            | numeric                  | YES         | null                         |
| public       | delinquent_accounts | 6                | expected_to_date          | numeric                  | YES         | null                         |
| public       | delinquent_accounts | 7                | first_due_date            | date                     | YES         | null                         |
| public       | delinquent_accounts | 8                | last_due_date             | date                     | YES         | null                         |
| public       | delinquent_accounts | 9                | actual_installments       | bigint                   | YES         | null                         |
| public       | delinquent_accounts | 10               | actual_total              | numeric                  | YES         | null                         |
| public       | delinquent_accounts | 11               | first_payment_date        | date                     | YES         | null                         |
| public       | delinquent_accounts | 12               | last_payment_date         | date                     | YES         | null                         |
| public       | delinquent_accounts | 13               | compliance_pct            | numeric                  | YES         | null                         |
| public       | delinquent_accounts | 14               | variance                  | numeric                  | YES         | null                         |
| public       | delinquent_accounts | 15               | compliance_status         | text                     | YES         | null                         |
| public       | delinquent_accounts | 16               | days_delinquent           | integer                  | YES         | null                         |
| public       | expected_payments   | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | expected_payments   | 2                | project_id                | uuid                     | NO          | null                         |
| public       | expected_payments   | 3                | unit_number               | text                     | NO          | null                         |
| public       | expected_payments   | 4                | due_date                  | date                     | NO          | null                         |
| public       | expected_payments   | 5                | amount                    | numeric                  | NO          | null                         |
| public       | expected_payments   | 6                | installment_number        | integer                  | YES         | null                         |
| public       | expected_payments   | 7                | schedule_type             | text                     | YES         | 'budget'::text               |
| public       | expected_payments   | 8                | notes                     | text                     | YES         | null                         |
| public       | expected_payments   | 9                | created_at                | timestamp with time zone | YES         | now()                        |
| public       | expected_payments   | 10               | updated_at                | timestamp with time zone | YES         | now()                        |
| public       | expected_payments   | 11               | row_version               | integer                  | YES         | 1                            |
| public       | payment_compliance  | 1                | project_name              | text                     | YES         | null                         |
| public       | payment_compliance  | 2                | unit_number               | text                     | YES         | null                         |
| public       | payment_compliance  | 3                | client_name               | text                     | YES         | null                         |
| public       | payment_compliance  | 4                | expected_installments     | bigint                   | YES         | null                         |
| public       | payment_compliance  | 5                | expected_total            | numeric                  | YES         | null                         |
| public       | payment_compliance  | 6                | expected_to_date          | numeric                  | YES         | null                         |
| public       | payment_compliance  | 7                | first_due_date            | date                     | YES         | null                         |
| public       | payment_compliance  | 8                | last_due_date             | date                     | YES         | null                         |
| public       | payment_compliance  | 9                | actual_installments       | bigint                   | YES         | null                         |
| public       | payment_compliance  | 10               | actual_total              | numeric                  | YES         | null                         |
| public       | payment_compliance  | 11               | first_payment_date        | date                     | YES         | null                         |
| public       | payment_compliance  | 12               | last_payment_date         | date                     | YES         | null                         |
| public       | payment_compliance  | 13               | compliance_pct            | numeric                  | YES         | null                         |
| public       | payment_compliance  | 14               | variance                  | numeric                  | YES         | null                         |
| public       | payment_compliance  | 15               | compliance_status         | text                     | YES         | null                         |
| public       | payment_compliance  | 16               | days_delinquent           | integer                  | YES         | null                         |
| public       | payments            | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | payments            | 2                | sale_id                   | uuid                     | NO          | null                         |
| public       | payments            | 3                | payment_date              | date                     | NO          | null                         |
| public       | payments            | 4                | amount                    | numeric                  | NO          | null                         |
| public       | payments            | 5                | payment_type              | USER-DEFINED             | NO          | null                         |
| public       | payments            | 6                | payment_method            | USER-DEFINED             | YES         | null                         |
| public       | payments            | 7                | notes                     | text                     | YES         | null                         |
| public       | payments            | 8                | created_at                | timestamp with time zone | NO          | now()                        |
| public       | payments            | 9                | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | payments            | 10               | row_version               | integer                  | NO          | 1                            |
| public       | projects            | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | projects            | 2                | name                      | text                     | NO          | null                         |
| public       | projects            | 3                | created_at                | timestamp with time zone | NO          | now()                        |
| public       | projects            | 4                | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | projects            | 5                | row_version               | integer                  | NO          | 1                            |
| public       | projects            | 6                | display_name              | text                     | YES         | null                         |
| public       | projects            | 7                | sociedad                  | text                     | YES         | null                         |
| public       | sales_reps          | 1                | id                        | text                     | NO          | null                         |
| public       | sales_reps          | 2                | name                      | text                     | NO          | null                         |
| public       | sales_reps          | 3                | contract_start_date       | date                     | YES         | null                         |
| public       | sales_reps          | 4                | contract_end_date         | date                     | YES         | null                         |
| public       | sales_reps          | 5                | created_at                | timestamp with time zone | NO          | now()                        |
| public       | sales_reps          | 6                | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | sales_reps          | 7                | row_version               | integer                  | NO          | 1                            |
| public       | sales               | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | sales               | 2                | project_id                | uuid                     | NO          | null                         |
| public       | sales               | 3                | unit_id                   | uuid                     | NO          | null                         |
| public       | sales               | 4                | client_id                 | uuid                     | NO          | null                         |
| public       | sales               | 5                | sales_rep_id              | text                     | NO          | FK→sales_reps(id)            |
| public       | sales               | 6                | sale_date                 | date                     | NO          | null                         |
| public       | sales               | 7                | price_with_tax            | numeric                  | NO          | null                         |
| public       | sales               | 8                | price_without_tax         | numeric                  | NO          | null                         |
| public       | sales               | 9                | down_payment_amount       | numeric                  | NO          | null                         |
| public       | sales               | 10               | financed_amount           | numeric                  | NO          | null                         |
| public       | sales               | 11               | referral_name             | text                     | YES         | null                         |
| public       | sales               | 12               | referral_applies          | boolean                  | NO          | false                        |
| public       | sales               | 13               | status                    | USER-DEFINED             | NO          | 'active'::sale_status        |
| public       | sales               | 14               | promise_signed_date       | date                     | YES         | null                         |
| public       | sales               | 15               | deed_signed_date          | date                     | YES         | null                         |
| public       | sales               | 16               | created_at                | timestamp with time zone | NO          | now()                        |
| public       | sales               | 17               | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | sales               | 18               | row_version               | integer                  | NO          | 1                            |
| public       | sales               | 19               | caso_especial             | boolean                  | NO          | false                        |
| public       | sales               | 20               | observaciones             | text                     | YES         | null                         |
| public       | sales               | 21               | notas                     | text                     | YES         | null                         |
| public       | sales               | 22               | caso_especial_type        | text                     | YES         | null                         |
| public       | units               | 1                | id                        | uuid                     | NO          | uuid_v7()                    |
| public       | units               | 2                | project_id                | uuid                     | NO          | null                         |
| public       | units               | 3                | unit_number               | text                     | NO          | null                         |
| public       | units               | 4                | price_with_tax            | numeric                  | NO          | null                         |
| public       | units               | 5                | price_without_tax         | numeric                  | NO          | null                         |
| public       | units               | 6                | down_payment_amount       | numeric                  | NO          | null                         |
| public       | units               | 7                | status                    | USER-DEFINED             | NO          | 'available'::unit_status     |
| public       | units               | 8                | created_at                | timestamp with time zone | NO          | now()                        |
| public       | units               | 9                | updated_at                | timestamp with time zone | NO          | now()                        |
| public       | units               | 10               | row_version               | integer                  | NO          | 1                            |