        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Community Review System')
            .setDescription('Your feedback helps Jaxdrax Studio improve Your Fish Life and the way our staff supports the community.\n\nChoose below what you want to review. Both options require a rating out of 5 and a written comment.\n\nPlease note: your Discord username, your user ID and the date will be displayed with your review. Please stay respectful and constructive.')
            .addFields(
                {
                    name: 'Option 1 - Review the Server',
                    value: 'Rate Your Fish Life, the community, the channels and the overall experience. One rating out of 5 plus one comment.',
                    inline: false
                },
                {
                    name: 'Option 2 - Review a Staff Member',
                    value: 'Rate a specific staff member on their help, attitude and efficiency. You must provide their username, mention or ID, plus a rating and a comment.',
                    inline: false
                },
                {
                    name: 'Current Server Rating',
                    value: `${average}${serverReviews.length > 0 ? ' / 5' : ''}\nTotal server reviews: ${serverReviews.length}`,
                    inline: false
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Community Feedback', iconURL: LOGO_URL })
            .setTimestamp();
