# PLAN.md

1. **Add an input field for pasting an external resume .PDF URLs** on the [extract page](extract/). We'll use this to output .json for the AI Builder to place in the their cv folder.

2. **In the "work" node of the detailed.json file**, use the order of the fields to set the bold title for each work (job) listed. The Harvard standard is "organization" first. Include support for the term "organization" as an alternative to "company".
