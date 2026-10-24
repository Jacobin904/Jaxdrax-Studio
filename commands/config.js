        const successText = results.success.length > 0 
            ? results.success.map(s => `[SUCCESS] ${s}`).join('\n')
            : 'No successful checks.';

        const errorsText = results.errors.length > 0
            ? results.errors.map(e => `[ERROR] ${e}`).join('\n')
            : 'No errors found. All checks passed!';

        const checksEmbed = new EmbedBuilder()
            .setColor(results.errors.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('Server Configuration - Automatic Checks')
            .setDescription(`Total Checks: ${results.success.length + results.errors.length}\nSuccessful: ${results.success.length}\nFailed: ${results.errors.length}\n\n${results.errors.length > 0 ? 'ATTENTION: Some checks failed.' : 'ALL CHECKS PASSED: Your server is properly configured!'}`)
            .addFields(
                {
                    name: `Successful Checks (${results.success.length})`,
                    value: successText.substring(0, 1024) || 'None',
                    inline: false
                },
                {
                    name: `Failed Checks (${results.errors.length})`,
                    value: errorsText.substring(0, 1024) || 'None',
                    inline: false
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [checksEmbed] });
