using System;
using System.Diagnostics;
using System.IO;

namespace Optimizer
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            string appDir = @"d:\Optimzer";
            string electronExe = Path.Combine(appDir, @"node_modules\electron\dist\electron.exe");

            try
            {
                if (File.Exists(electronExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = electronExe;
                    psi.Arguments = ".";
                    psi.WorkingDirectory = appDir;
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                }
                else
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = "cmd.exe";
                    psi.Arguments = "/c npm run dev:electron";
                    psi.WorkingDirectory = appDir;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    Process.Start(psi);
                }
            }
            catch (Exception ex)
            {
                System.Windows.Forms.MessageBox.Show(
                    "Erro ao iniciar o Optimizer: " + ex.Message,
                    "Optimizer",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error
                );
            }
        }
    }
}
