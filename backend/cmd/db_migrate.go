package cmd

import (
	"fmt"
	"os"

	"beast-royale-backend/internal/db"

	"github.com/spf13/cobra"
)

// dbMigrateCmd represents the db-migrate command
var dbMigrateCmd = &cobra.Command{
	Use:   "db-migrate",
	Short: "create tables in the target db",
	Run: func(cmd *cobra.Command, args []string) {
		err := db.Init()
		if err != nil {
			fmt.Printf("init db failed: %+v\n", err)
			os.Exit(-1)
		}
		err = migrate()
		if err != nil {
			fmt.Printf("create db table failed: %+v\n", err)
			os.Exit(-1)
		}
		fmt.Println("db migrate success!")
	},
}

func init() {
	rootCmd.AddCommand(dbMigrateCmd)
}

func migrate() error {
	return db.Migrate()
}
