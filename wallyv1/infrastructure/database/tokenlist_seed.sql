INSERT INTO tokens (address, name, symbol, decimals, verified, url, creation_date, zero_count) VALUES
('0x4200000000000000000000000000000000000006', 'Base USDC', 'USDbC', 6, true, 'https://basescan.org/token/0x4200000000000000000000000000000000000006', '2023-07-13 16:00:00', 2),
('0xd9fcd98c322942075a5c3860693e9f4f03aae07b', 'USDT', 'USDT', 6, true, 'https://basescan.org/token/0xd9fcd98c322942075a5c3860693e9f4f03aae07b', '2023-08-01 16:00:00', 2),
('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'ExampleToken', 'EXM', 18, false, '', NULL, 0);
// This is a placeholder for the tokenlist_seed.sql file.
ALTER TABLE tokens ADD CONSTRAINT immutable CHECK (true);