        const successText = results.success.length > 0 
            ? results.success.map(s => `<:circlechecksolid:1563676230224707674> ${s}`).join('\n')
            : 'No successful checks.';

        const errorsText = results.errors.length > 0
            ? results.errors.map(e => `<:circlexmarksolid:1563676313770791134> ${e}`).join('\n')
            : 'No errors found. All checks passed!';

        const checksEmbed = new EmbedBuilder()
            .setColor(results.errors.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('<:gearsolid:1563675488222978068> Server Configuration - Automatic Checks')
            .setDescription(`**Total Checks:** ${results.success.length + results.errors.length}\n**Successful:** ${results.success.length}\n**Failed:** ${results.errors.length}\n\n${results.errors.length > 0 ? '<:triangleexclamationsolid:1563676405890416670> **ATTENTION:** Some checks failed. Please fix the issues below to ensure proper bot functionality.' : '<:circlechecksolid:1563676230224707674> **ALL CHECKS PASSED:** Your server is properly configured!'}`)
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
