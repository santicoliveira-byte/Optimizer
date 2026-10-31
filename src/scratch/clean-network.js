const { PowerShellRunner } = require('../../dist-electron/main/engine/powershell-runner');
const runner = PowerShellRunner.getInstance();

const script = `
  Get-NetIPInterface | Where-Object { $_.InterfaceAlias -in @('Wi-Fi', 'Ethernet') } | Set-NetIPInterface -AutomaticMetric Enabled -ErrorAction SilentlyContinue
  Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "NetworkThrottlingIndex" -Value 10 -Type DWord -ErrorAction SilentlyContinue
  Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "SystemResponsiveness" -Value 20 -Type DWord -ErrorAction SilentlyContinue
  netsh int tcp set global autotuninglevel=normal
  netsh int tcp set global rss=enabled
  netsh int tcp set global ecncapability=disabled
  netsh int tcp set global rsc=enabled
  Get-NetAdapterAdvancedProperty -DisplayName "*Roaming Aggressiveness*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "3" -ErrorAction SilentlyContinue
`;

runner.run(script, 20000, true).then((r) => {
  console.log('Result:', JSON.stringify(r));
  process.exit(0);
});
