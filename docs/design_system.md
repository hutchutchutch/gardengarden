GardenSnap Design System Style Guide
🎨 Brand Identity
Design Philosophy: Natural Growth Through Digital Learning
Our design system embodies the nurturing journey of plant growth, combining earthy authenticity with modern digital clarity. Every element should feel approachable, encouraging, and alive—just like a thriving garden.

🌈 Color Palette
Primary Colors
TokenHex ValueColor NameUsageprimary.50#E8F5E9Mint CreamBackgroundsprimary.100#C8E6C9Light SageHover statesprimary.200#A5D6A7Soft SageInactive elementsprimary.300#81C784Fresh SageSecondary actionsprimary.400#66BB6AGarden GreenPrimary buttonsprimary.500#4CAF50Growth GreenMain brand colorprimary.600#43A047Deep GardenPressed statesprimary.700#388E3CForestHeadersprimary.800#2E7D32Dark ForestText on lightprimary.900#1B5E20Midnight ForestHigh contrast

AI Chat Colors
TokenHex ValueColor NameUsageai.50#F3F4F6Light LavenderAI backgroundsai.100#E5E7EBGentle GrayStudent messagesai.200#C4B5FDSoft LavenderAI hoverstatesai.300#A78BFAGentle PurpleAI chat bubblesai.400#8B5CF6Active PurpleAI button activeai.500#7C3AEDDeep PurpleAI emphasizedai.600#6D28D9Bold PurpleAI headers
Secondary Colors
TokenHex ValueColor NameUsagesecondary.50#FFF3E0Sunshine CreamHighlightssecondary.100#FFE0B2Soft AmberBadgessecondary.200#FFCC80Golden HourWarningssecondary.300#FFB74DWarm AmberAccentssecondary.400#FFA726Sunset OrangeNotificationssecondary.500#FF9800Harvest OrangeCTAssecondary.600#FB8C00PumpkinActive statessecondary.700#F57C00Deep OrangeEmphasissecondary.800#EF6C00Burnt OrangeAlertssecondary.900#E65100Dark AmberCritical
Semantic Colors
CategoryTokenHex ValueUsageStatussuccess#4CAF50Positive feedbackwarning#FFB74DCaution stateserror#F44336Error statesinfo#2196F3InformationalHealthexcellent#4CAF5080-100% healthgood#8BC34A60-79% healthfair#FFB74D40-59% healthpoor#FF704320-39% healthcritical#F443360-19% health
Surface Colors
TokenLight ModeDark ModeUsagebackground#FAFAFA#121212App backgroundpaper#FFFFFF#1E1E1ECards, sheetselevated#FFFFFF#252525Elevated surfacesoverlayrgba(0,0,0,0.5)rgba(0,0,0,0.7)Modal backdrop
Text Colors
TokenLight ModeDark ModeUsagetext.primaryrgba(0,0,0,0.87)rgba(255,255,255,0.87)High emphasistext.secondaryrgba(0,0,0,0.60)rgba(255,255,255,0.60)Medium emphasistext.disabledrgba(0,0,0,0.38)rgba(255,255,255,0.38)Disabled statetext.hintrgba(0,0,0,0.38)rgba(255,255,255,0.38)Placeholder

📏 Spacing System
Base Unit: 4px - All spacing follows a 4px grid system
Spacing Scale
TokenValueUsagexxs4pxTight spacingxs8pxCompact elementssm12pxRelated itemsmd16pxDefault spacinglg24pxSection spacingxl32pxMajor sectionsxxl48pxPage sectionsxxxl64pxHero spacing
Layout Constants
ElementPaddingMarginScreen16px-Card16px12px betweenList Item12px vertical, 16px horizontal-Input Field12px vertical, 16px horizontal8px betweenButton12px vertical, 24px horizontal16px between

📝 Typography
Font Stack
CategoryFont FamilyFallbackPrimaryInter-apple-system, system-uiSecondaryNunito Sans-apple-system, system-uiMonospaceJetBrains Monomonospace
Type Scale
StyleSizeLine HeightWeightLetter SpacingUsageH132px40px700-0.5pxScreen titlesH228px36px600-0.3pxSection headersH324px32px6000Card titlesH420px28px6000SubheadingsH518px24px5000List headersH616px20px5000.15pxEmphasized bodyBody116px24px4000.15pxDefault bodyBody214px20px4000.25pxSecondary textButton16px20px5000.5pxButton labelsCaption12px16px4000.4pxHelper textOverline10px14px5001pxLabels (uppercase)

🎯 Interactive Elements
Button Specifications
Sizes
SizeHeightPadding (H)Font SizeSmall32px16px14pxMedium40px24px16pxLarge48px32px18px
Variants
VariantBackgroundText ColorBorderUsagePrimaryprimary.500WhiteNoneMain actionsSecondarysecondary.500WhiteNoneSecondary actionsOutlineTransparentprimary.5001px primary.500Alternative actionsTextTransparentprimary.500NoneLow emphasis
States
StateChangesDefaultBase stylesHoverDarken 10%, elevation 2PressedDarken 20%, elevation 1, scale 0.98DisabledOpacity 0.38LoadingShow spinner, disable interaction
Input Field Specifications
PropertyValueHeight56pxBorder Radius8pxBorder Width1px (2px on focus)Padding16px horizontalFont Size16pxLabel PositionFloating
Input States
StateBorder ColorBackgroundOtherDefaultrgba(0,0,0,0.12)White-Focusedprimary.500White2px borderErrorerrorWhite2px border, helper textDisabledrgba(0,0,0,0.12)rgba(0,0,0,0.04)Reduced opacity

📐 Component Guidelines
Cards
PropertyValueBorder Radius12pxPadding16pxElevation2 (default), 4 (hover)Backgroundsurface.paperMargin12px between cards
Corner Radius Scale
TokenValueUsagexs4pxChips, badgessm8pxInputs, buttonsmd12pxCards, modalslg16pxBottom sheetsxl24pxSpecial elementsfull999pxPills, avatars
Elevation Levels
LevelShadow ValuesUsage0NoneFlat elements10 1px 1px rgba(0,0,0,0.18)Rest state20 2px 1.41px rgba(0,0,0,0.20)Cards40 4px 3.84px rgba(0,0,0,0.25)Hover state80 8px 4.65px rgba(0,0,0,0.30)Modals, popovers

🎪 Animation Guidelines
Duration Scale
TokenValueUsageinstant100msRipples, state changesfast200msHover effectsnormal300msMost animationsslow400msComplex transitionsverySlow600msPage transitions
Easing Functions
NameValueUsageStandardcubic-bezier(0.4, 0.0, 0.2, 1)Most animationsDeceleratecubic-bezier(0.0, 0.0, 0.2, 1)Enter animationsAcceleratecubic-bezier(0.4, 0.0, 1, 1)Exit animationsSharpcubic-bezier(0.4, 0.0, 0.6, 1)Quick animations

🖼️ Iconography
Icon Specifications
PropertyValueLibraryLucide React NativeDefault Size24x24pxTouch Target44x44px minimumStroke Width2pxStyleOutlined
Common Icons
CategoryIconNameNavigation🏠home📷camera📚layers💬message-circle📈trending-upActions➕plus🗑️trash-2✏️edit-3💾save🔗share-2Plant🌱sprout🍃leaf🌸flower☀️sun💧droplet

📱 Platform-Specific Guidelines
Story Cards

Aspect Ratio: 4:5 (portrait)
Border Radius: 12px
Health Badge: Top-right, 12px margin
Text Overlay: Bottom gradient (rgba(0,0,0,0) to rgba(0,0,0,0.6))

Chat Bubbles
TypeBackgroundText ColorAlignmentTeacher#3B82F6WhiteLeftAI Assistant#A78BFA (Gentle Purple)WhiteLeftStudent (self)#E5E7EB (Gentle Gray)BlackRight

Max Width: 80% of screen
Border Radius: 18px (4px on attachment corner)
Padding: 12px horizontal, 8px vertical

Health Indicators
LevelColorIconLabelExcellent#4CAF50smileThriving!Good#8BC34AmehHealthyFair#FFB74DfrownNeeds CarePoor#FF7043alert-triangleStrugglingCritical#F44336alert-circleCritical

♿ Accessibility Guidelines
Contrast Requirements
Element TypeMinimum RatioNormal text4.5:1Large text (18px+)3:1Interactive elements3:1Disabled states1.5:1
Touch Targets

Minimum: 44x44px
Recommended: 48x48px
Spacing: 8px minimum between targets

Screen Reader Support

✅ All interactive elements have accessible labels
✅ Images include descriptive alt text
✅ Form errors announced immediately
✅ Progress updates at 25% intervals
✅ Focus indicators visible


🎯 Best Practices
Do's ✅

Use consistent spacing (4px grid)
Maintain clear visual hierarchy
Apply elevation meaningfully
Provide interaction feedback
Design for one-handed use
Test in both light/dark modes

Don'ts ❌

Mix border radius styles
Use more than 3 font sizes per screen
Combine icon styles
Use pure black for text
Rely only on color for meaning
Create custom patterns for standard interactions


🌱 Growth-Themed Elements
Progress Indicators

Seedling stages: Seed → Sprout → Seedling → Plant
Growth rings: Concentric circles for achievements
Leaf fill: Progress bars styled as filling leaves
Sun rays: Radial progress for streaks

Encouraging Microcopy
StateMessageSuccess"Your garden is thriving! 🌱"Error"Oops, let's try that again 🌿"Empty"Plant your first seed! 🌰"Loading"Growing something special..."Complete"Harvest time! 🍅"
Seasonal Variations (Optional)
SeasonPrimary AccentSecondaryThemeSpringLight GreenPinkNew growthSummerBright GreenYellowFull bloomFallOrangeBrownHarvestWinterDeep GreenBlueEvergreen

📋 Component Checklist
Before releasing any component:

 Follows 4px spacing grid
 Meets contrast requirements
 Has proper touch targets
 Includes loading state
 Includes error state
 Includes empty state
 Has accessibility labels
 Works in dark mode
 Follows animation guidelines
 Uses correct typography scale
 Has proper elevation
 Tested on iOS and Android


Last Updated: December 2024
Version: 1.0