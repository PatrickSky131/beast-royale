package cmd

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"beast-royale-backend/internal/api"
	"beast-royale-backend/internal/config"
	"beast-royale-backend/internal/db"
	"beast-royale-backend/internal/logger"
	"beast-royale-backend/server"

	"github.com/spf13/cobra"
)

// runCmd represents the run command
var runCmd = &cobra.Command{
	Use:   "run",
	Short: "run Beast Royale Backend service",
	Run: func(cmd *cobra.Command, args []string) {
		err := config.InitConfig(configPath)
		if err != nil {
			fmt.Printf("load config failed: %+v\n", err)
			os.Exit(-1)
		}

		// 初始化日志系统
		err = logger.Init()
		if err != nil {
			fmt.Printf("init logger failed: %+v\n", err)
			os.Exit(-1)
		}

		// 确保API包被初始化（调用init函数）
		_ = api.GetAllAction()

		err = db.Init()
		if err != nil {
			fmt.Printf("init db failed: %+v\n", err)
			os.Exit(-1)
		}
		fmt.Println("Using config file:", configPath)

		s := server.NewServer(config.GConf)
		go s.Run()
		fmt.Printf("http server running on: 0.0.0.0:%d\n", config.GConf.Server.Port)

		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		fmt.Printf("signal received: %s, server shutting down\n", sig)
		err = s.Stop()
		if err != nil {
			fmt.Printf("error shutting down server: %+v\n", err)
		}
	},
}

func init() {
	rootCmd.AddCommand(runCmd)
	runCmd.Flags().StringVarP(&configPath, "config", "c", "", "config file path")
	runCmd.MarkFlagRequired("config")
}
